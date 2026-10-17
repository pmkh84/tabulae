import { t } from "../i18n/index.js";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Pagination from "../components/Pagination";
import { getAllWarehouses } from "../api/warehouses";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SearchInput from "../components/SearchInput";
import SelectFilter from "../components/SelectFilter";
import ContainerFilters from "../components/ContainerFilters";
import { showStatusSummary } from "../utils/showStatusSummary";
import ExportCSVButton from "../components/ExportCSVButton";
import { exportFilteredWarehousesCSV } from "../utils/export";
import API_URL from "../api/config";
import WarehouseListTable from "../components/WarehouseListTable";
import WarehouseRequestFeedback from "../components/WarehouseRequestFeedback";
import ErrorMessage from "../components/ErrorMessage";
import { useWarehouseRequest } from "../hooks/useWarehouseRequest.js";
import { useWarehouseActions } from "../hooks/useWarehouseActions.js";
import { checkedWarehousePage } from "../utils/warehouseForm.js";
import { warehouseListContext, warehousePageOffset, updateWarehouseQuery } from "../utils/warehouseNavigation.js";

export default function WarehouseList() {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchTerm, isActive, offset } = warehouseListContext(searchParams);
  const changeQuery = (changes) => setSearchParams(updateWarehouseQuery(searchParams, changes), { replace: true });
  const returnTo = location.pathname + location.search;
  const limit = 10;
  const [selected, setSelected] = useState([]);
  const loader = useCallback(async () => checkedWarehousePage(await getAllWarehouses(accessToken, limit, offset, searchTerm, isActive)),
    [accessToken, offset, searchTerm, isActive]);
  const request = useWarehouseRequest(loader, location.key);
  const actions = useWarehouseActions({ accessToken, onChanged: request.retry });
  const warehouses = request.data?.data ?? [];
  const total = request.data?.total ?? 0;

  useEffect(() => { setSelected([]); }, [request.data]);
  useEffect(() => {
    if (request.status !== "ready") return;
    const next = warehousePageOffset(offset, total, limit);
    if (next !== offset) setSearchParams(updateWarehouseQuery(searchParams, { offset: next }), { replace: true });
  }, [request.status, offset, total, searchParams, setSearchParams]);
  useEffect(() => { document.title = t("breadcrumbs.warehouseList"); }, []);

  const handleDelete = async (id) => {
    if (user?.role !== "admin") return;
    if (await actions.remove(id, () => window.confirm(t("warehouses.confirmDelete")))) alert(t("warehouses.deleted"));
  };
  const handleBulk = async (status) => {
    if (user?.role !== "admin" || !selected.length) return;
    const result = await actions.bulk(selected, status, () => window.confirm(t("warehouses.confirmBulkDeactivate")));
    if (result) showStatusSummary(result, "warehouses", status ? "activate" : "deactivate");
  };
  const toggleSelected = (id) => setSelected((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]);
  const toggleAll = () => setSelected(selected.length === warehouses.length ? [] : warehouses.map((warehouse) => warehouse.id));

  return <>
    <Navbar />
    <Breadcrumb />
    <div className="p-6 mx-auto space-y-6">
      {location.state?.warehouseFeedback === "created" && <p role="status" className="text-sm text-green-700">{t("warehouses.created")}</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t("breadcrumbs.warehouseList")}</h1>
        {user?.role === "admin" && <button type="button" onClick={() => navigate("/warehouses/new", { state: { warehouseReturnTo: returnTo } })}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm">{"+ " + t("navigation.createWarehouse")}</button>}
      </div>
      <ContainerFilters extraContent={<ExportCSVButton onExport={() => exportFilteredWarehousesCSV({ accessToken, apiUrl: API_URL, filters: { searchTerm, isActive } })}
        label={"📤 " + t("common.exportCSV")} />}>
        <SearchInput label={t("common.search")} placeholder={t("common.searchName")} value={searchTerm}
          onChange={(event) => changeQuery({ search: event.target.value, offset: 0 })} />
        <SelectFilter label={t("common.status")} value={isActive} onChange={(event) => changeQuery({ is_active: event.target.value, offset: 0 })}
          options={[{ value: "", label: t("common.all") }, { value: "true", label: t("common.active") }, { value: "false", label: t("common.inactive") }]} />
      </ContainerFilters>
      <ErrorMessage message={actions.error} />
      {actions.pending && <p role="status" className="text-sm text-gray-600">{t("common.submitting")}</p>}
      {user?.role === "admin" && request.status === "ready" && selected.length > 0 && <div className="flex gap-2">
        <button type="button" disabled={actions.pending} onClick={() => handleBulk(true)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm">{t("common.activateSelected")}</button>
        <button type="button" disabled={actions.pending} onClick={() => handleBulk(false)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm">{t("common.deactivateSelected")}</button>
      </div>}
      <WarehouseRequestFeedback request={request} />
      {request.status === "ready" && <>
        <WarehouseListTable warehouses={warehouses} selected={selected} toggleSelected={toggleSelected} toggleAll={toggleAll} handleDelete={handleDelete} pending={actions.pending} returnTo={returnTo} />
        <Pagination total={total} limit={limit} offset={offset} onPageChange={(value) => changeQuery({ offset: value })} />
      </>}
    </div>
  </>;
}
