"""PostgreSQL trigger tests, isolated from app/tests/conftest.py cleanup fixtures.

Set TABULAE_DISPOSABLE_PG_DSN to an empty, throwaway PostgreSQL database named
tabulae_disposable_*, then set TABULAE_DISPOSABLE_PG_CONFIRM_DATABASE to its
exact database name. These tests never connect to the application's DATABASE_URL.
"""

import asyncio
import os
import re
from pathlib import Path
from uuid import uuid4

import asyncpg
import pytest
import pytest_asyncio


ROOT = Path(__file__).resolve().parents[2]
INITIAL_SCHEMA = (ROOT / "db_init" / "01_db_tables_trigger.sql").read_text(encoding="utf-8")
MIGRATION = (ROOT / "db_migrations" / "20261020_001_atomic_stock_deduction.sql").read_text(encoding="utf-8")


def test_initial_schema_and_migration_use_identical_trigger_function():
    pattern = r"CREATE OR REPLACE FUNCTION update_stock\(\) RETURNS TRIGGER AS \$\$.*?\$\$ LANGUAGE plpgsql;"
    initial_function = re.search(pattern, INITIAL_SCHEMA, re.S)
    migrated_function = re.search(pattern, MIGRATION, re.S)
    assert initial_function is not None
    assert migrated_function is not None
    assert initial_function.group() == migrated_function.group()


@pytest_asyncio.fixture
async def stock_db():
    dsn = os.environ.get("TABULAE_DISPOSABLE_PG_DSN")
    confirmed_name = os.environ.get("TABULAE_DISPOSABLE_PG_CONFIRM_DATABASE")
    if not dsn or not confirmed_name or not confirmed_name.startswith("tabulae_disposable_"):
        pytest.fail("An explicit, confirmed tabulae_disposable_* PostgreSQL database is required")

    admin = await asyncpg.connect(dsn=dsn, timeout=5)
    schema = f"stock_test_{uuid4().hex}"
    created = False
    try:
        database_name = await admin.fetchval("SELECT current_database()")
        if database_name != confirmed_name:
            pytest.fail("Connected database does not match TABULAE_DISPOSABLE_PG_CONFIRM_DATABASE")
        existing_tables = await admin.fetchval(
            "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
            "WHERE c.relkind IN ('r', 'p') AND n.nspname NOT IN ('pg_catalog', 'information_schema') "
            "AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp_%'"
        )
        if existing_tables:
            pytest.fail("Disposable test database must have no application tables")

        await admin.execute(f'CREATE SCHEMA "{schema}"')
        created = True
        await admin.execute(f'SET search_path TO "{schema}", pg_catalog')
        await admin.execute(INITIAL_SCHEMA)
        await admin.execute(MIGRATION)
        trigger_count = await admin.fetchval(
            "SELECT count(*) FROM pg_trigger WHERE tgrelid = 'stock_move_line'::regclass "
            "AND tgname = 'trg_update_stock' AND NOT tgisinternal"
        )
        constraint_count = await admin.fetchval(
            "SELECT count(*) FROM pg_constraint WHERE conrelid = 'stock'::regclass "
            "AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%quantity >= 0%'"
        )
        assert trigger_count == 1
        assert constraint_count == 1

        user_id = await admin.fetchval(
            'INSERT INTO "user" (name, email, password, role) '
            "VALUES ('Test user', 'test@example.invalid', 'test', 'admin') RETURNING id"
        )
        warehouse_id = await admin.fetchval("INSERT INTO warehouse (name) VALUES ('Test warehouse') RETURNING id")
        category_id = await admin.fetchval("INSERT INTO product_category (name) VALUES ('Test category') RETURNING id")
        product_id = await admin.fetchval(
            "INSERT INTO product (sku, short_name, category_id) VALUES ('TEST001', 'Test product', $1) RETURNING id",
            category_id,
        )

        async def connect():
            connection = await asyncpg.connect(dsn=dsn, timeout=5)
            await connection.execute(f'SET search_path TO "{schema}", pg_catalog')
            return connection

        yield {
            "admin": admin,
            "connect": connect,
            "user_id": user_id,
            "warehouse_id": warehouse_id,
            "product_id": product_id,
        }
    finally:
        await admin.close()
        if created:
            cleanup = await asyncpg.connect(dsn=dsn, timeout=5)
            try:
                assert await cleanup.fetchval("SELECT current_database()") == confirmed_name
                await cleanup.execute(f'DROP SCHEMA "{schema}" CASCADE')
            finally:
                await cleanup.close()


async def insert_movement(connection, db, move_type, lines):
    move_id = await connection.fetchval(
        "INSERT INTO stock_move (move_type, user_id) VALUES ($1, $2) RETURNING id",
        move_type, db["user_id"],
    )
    for line_id, (lot, quantity) in enumerate(lines, 1):
        await connection.execute(
            "INSERT INTO stock_move_line "
            "(move_id, line_id, warehouse_id, product_id, lot, quantity) "
            "VALUES ($1, $2, $3, $4, $5, $6)",
            move_id, line_id, db["warehouse_id"], db["product_id"], lot, quantity,
        )
    return move_id


async def record_movement(db, move_type, lines):
    connection = await db["connect"]()
    try:
        async with connection.transaction():
            return await insert_movement(connection, db, move_type, lines)
    finally:
        await connection.close()


async def stock_quantity(db, lot="LOT"):
    return await db["admin"].fetchval(
        'SELECT quantity FROM "stock" WHERE warehouse_id = $1 AND product_id = $2 AND lot = $3',
        db["warehouse_id"], db["product_id"], lot,
    )


async def history(db):
    rows = await db["admin"].fetch(
        "SELECT m.move_type, l.line_id, l.lot, l.quantity "
        "FROM stock_move m JOIN stock_move_line l ON l.move_id = m.id "
        "ORDER BY m.id, l.line_id"
    )
    return [tuple(row) for row in rows]


@pytest.mark.asyncio
async def test_sufficient_outgoing_reduces_stock_and_records_history(stock_db):
    await record_movement(stock_db, "incoming", [("LOT", 10)])
    await record_movement(stock_db, "outgoing", [("LOT", 8)])
    assert await stock_quantity(stock_db) == 2
    assert await history(stock_db) == [("incoming", 1, "LOT", 10), ("outgoing", 1, "LOT", 8)]


@pytest.mark.asyncio
async def test_insufficient_outgoing_rolls_back_header_and_line(stock_db):
    await record_movement(stock_db, "incoming", [("LOT", 10)])
    with pytest.raises(asyncpg.PostgresError, match="Insufficient stock"):
        await record_movement(stock_db, "outgoing", [("LOT", 11)])
    assert await stock_quantity(stock_db) == 10
    assert await history(stock_db) == [("incoming", 1, "LOT", 10)]
    assert await stock_db["admin"].fetchval("SELECT count(*) FROM stock_move") == 1


@pytest.mark.asyncio
async def test_missing_stock_rejects_outgoing_without_history(stock_db):
    with pytest.raises(asyncpg.PostgresError, match="Insufficient stock"):
        await record_movement(stock_db, "outgoing", [("LOT", 1)])
    assert await stock_quantity(stock_db) is None
    assert await history(stock_db) == []
    assert await stock_db["admin"].fetchval("SELECT count(*) FROM stock_move") == 0


@pytest.mark.asyncio
async def test_concurrent_outgoing_allows_exactly_one_movement(stock_db):
    await record_movement(stock_db, "incoming", [("LOT", 10)])
    first_updated = asyncio.Event()
    allow_first_commit = asyncio.Event()

    async def first():
        connection = await stock_db["connect"]()
        try:
            async with connection.transaction():
                await insert_movement(connection, stock_db, "outgoing", [("LOT", 8)])
                first_updated.set()
                await allow_first_commit.wait()
        finally:
            first_updated.set()
            await connection.close()

    async def second():
        await first_updated.wait()
        try:
            await record_movement(stock_db, "outgoing", [("LOT", 8)])
            return None
        except asyncpg.PostgresError as error:
            return error

    first_task = asyncio.create_task(first())
    second_task = asyncio.create_task(second())
    try:
        await asyncio.wait_for(first_updated.wait(), timeout=5)
        await asyncio.sleep(0.1)
        second_waited_for_lock = not second_task.done()
    finally:
        allow_first_commit.set()
    _, second_error = await asyncio.wait_for(asyncio.gather(first_task, second_task), timeout=10)
    assert second_waited_for_lock
    assert isinstance(second_error, asyncpg.PostgresError)
    assert "Insufficient stock" in str(second_error)
    assert await stock_quantity(stock_db) == 2
    assert await history(stock_db) == [("incoming", 1, "LOT", 10), ("outgoing", 1, "LOT", 8)]
    assert await stock_db["admin"].fetchval("SELECT count(*) FROM stock_move") == 2


@pytest.mark.asyncio
async def test_multiline_failure_rolls_back_earlier_deduction(stock_db):
    await record_movement(stock_db, "incoming", [("LOT", 10)])
    with pytest.raises(asyncpg.PostgresError, match="Insufficient stock"):
        await record_movement(stock_db, "outgoing", [("LOT", 4), ("MISSING", 1)])
    assert await stock_quantity(stock_db) == 10
    assert await history(stock_db) == [("incoming", 1, "LOT", 10)]
    assert await stock_db["admin"].fetchval("SELECT count(*) FROM stock_move") == 1


@pytest.mark.asyncio
async def test_repeated_lines_for_one_stock_row_are_checked_cumulatively(stock_db):
    await record_movement(stock_db, "incoming", [("LOT", 10)])
    await record_movement(stock_db, "outgoing", [("LOT", 4), ("LOT", 5)])
    assert await stock_quantity(stock_db) == 1
    assert await history(stock_db) == [
        ("incoming", 1, "LOT", 10), ("outgoing", 1, "LOT", 4), ("outgoing", 2, "LOT", 5),
    ]
    with pytest.raises(asyncpg.PostgresError, match="Insufficient stock"):
        await record_movement(stock_db, "outgoing", [("LOT", 1), ("LOT", 1)])
    assert await stock_quantity(stock_db) == 1
    assert await history(stock_db) == [
        ("incoming", 1, "LOT", 10), ("outgoing", 1, "LOT", 4), ("outgoing", 2, "LOT", 5),
    ]
    assert await stock_db["admin"].fetchval("SELECT count(*) FROM stock_move") == 2


@pytest.mark.asyncio
async def test_incoming_movements_still_accumulate_by_lot(stock_db):
    await record_movement(stock_db, "incoming", [("LOT", 3)])
    await record_movement(stock_db, "incoming", [("LOT", 7), ("OTHER", 2)])
    assert await stock_quantity(stock_db) == 10
    assert await stock_quantity(stock_db, "OTHER") == 2
    assert await history(stock_db) == [
        ("incoming", 1, "LOT", 3), ("incoming", 1, "LOT", 7), ("incoming", 2, "OTHER", 2),
    ]
