-- TASK-005: apply once to an existing database after verifying its target and backup.
-- The PostgreSQL initialization scripts do not run again for existing volumes.
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgrelid = 'stock_move_line'::regclass
          AND tgname = 'trg_update_stock'
          AND NOT tgisinternal
          AND tgfoid = 'update_stock()'::regprocedure
    ) THEN
        RAISE EXCEPTION 'Expected trg_update_stock on stock_move_line is missing or different';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'stock'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%quantity >= 0%'
    ) THEN
        RAISE EXCEPTION 'Expected non-negative stock quantity constraint is missing';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'stock_move_line'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%quantity > 0%'
    ) THEN
        RAISE EXCEPTION 'Expected positive movement line quantity constraint is missing';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_stock() RETURNS TRIGGER AS $$
DECLARE 
    move_type_value VARCHAR(10);
    move_user INT;
    processed_lot VARCHAR(50);
BEGIN
    -- Retrieve the move type and user who created the stock move
    SELECT move_type, user_id INTO move_type_value, move_user 
    FROM stock_move 
    WHERE id = NEW.move_id;

    -- If lot is not specified, assign 'NO_LOT'
    processed_lot := COALESCE(NEW.lot, 'NO_LOT'); -- Replace NULL with 'NO_LOT'

    -- If the lot is 'NO_LOT' but an expiration date is provided, raise exception
    IF processed_lot = 'NO_LOT' AND NEW.expiration_date IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot assign an expiration date to a product with no lot';
    END IF;

    -- If the lot exists but with a different expiration date, raise exception
    IF processed_lot <> 'NO_LOT' AND (
        SELECT COUNT(*) FROM "stock" WHERE warehouse_id = NEW.warehouse_id 
                                    AND product_id = NEW.product_id
                                    AND lot = processed_lot
                                    AND expiration_date <> NEW.expiration_date) > 0 THEN
        RAISE EXCEPTION 'Lot % already exists with a different expiration date', processed_lot;
    END IF;

    -- If it's an incoming movement, increase stock quantity
    IF move_type_value = 'incoming' THEN
        INSERT INTO "stock" (warehouse_id, product_id, lot, expiration_date, quantity)
        VALUES (NEW.warehouse_id, NEW.product_id, processed_lot, NEW.expiration_date, NEW.quantity)
        ON CONFLICT (warehouse_id, product_id, lot)
        DO UPDATE SET quantity = "stock".quantity + NEW.quantity;

    -- If it's an outgoing movement, decrease stock quantity
    ELSIF move_type_value = 'outgoing' THEN

        -- Lock and recheck the matching row in one atomic deduction.
        UPDATE "stock"
        SET quantity = quantity - NEW.quantity
        WHERE warehouse_id = NEW.warehouse_id
          AND product_id = NEW.product_id
          AND lot = processed_lot
          AND quantity >= NEW.quantity;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient stock for product % in warehouse % with lot %', 
                            NEW.product_id, NEW.warehouse_id, processed_lot;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
