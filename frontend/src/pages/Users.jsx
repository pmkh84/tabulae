import { errorMessage } from "../i18n/errors.js";
import { t } from "../i18n/index.js";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import Pagination from "../components/Pagination";
import SearchInput from "../components/SearchInput";
import SelectFilter from "../components/SelectFilter";
import FiltersContainer from "../components/ContainerFilters";
import ExportCSVButton from "../components/ExportCSVButton";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import {
  getUsers,
  deleteUser,
  usersBulkStatus,
} from "../api/users";
import UsersListTable from "../components/UsersListTable";
import { exportFilteredUsersCSV } from "../utils/export";
import API_URL from "../api/config";

export default function Users() {
  const [loadError, setLoadError] = useState("");
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [is_active, setStatus] = useState("");
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      setLoadError("");
      const { data, total } = await getUsers({
        accessToken,
        limit,
        offset,
        searchTerm,
        is_active,
      });
      setUsers(data || []);
      setTotal(total || 0);
    } catch (error) {
      setLoadError(errorMessage(error));
      console.error("Error loading users:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, is_active, offset, limit]);

  useEffect(() => {
    document.title = t("navigation.users");
  }, []);

  const handleDelete = async (id) => {
    const confirm = window.confirm(t("users.confirmDelete"));
    if (!confirm) return;

    try {
      await deleteUser(id, accessToken);
      alert(t("users.deleted"));
      fetchUsers();
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const toggleSelected = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === users.length) {
      setSelected([]);
    } else {
      setSelected(users.map((u) => u.id));
    }
  };

  return (
    <>
      <Navbar />
      <Breadcrumb />
      {loadError && <p role="alert" className="px-6 py-2 text-sm text-red-600 whitespace-pre-line">{loadError}</p>}
      <div className="p-6 mx-auto space-y-6 max-w-7xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">{t("navigation.users")}</h1>
          <button
            role="button"
            onClick={() => navigate("/users/new")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm"
          >
            {"+ " + t("navigation.createUser")}
          </button>
        </div>

        <FiltersContainer
          extraContent={
            <ExportCSVButton
              onExport={() =>
                exportFilteredUsersCSV({
                  accessToken,
                  filters: { is_active, searchTerm },
                  apiUrl: API_URL,
                })
              }
              label={"📤 " + t("common.exportCSV")}
            />
          }
        >
          <SearchInput
            label={t("common.search")}
            placeholder={t("users.search")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setOffset(0);
            }}
          />
          <SelectFilter
            label={t("common.status")}
            value={is_active}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            options={[
              { value: "", label: t("common.all") },
              { value: "true", label: t("common.active") },
              { value: "false", label: t("common.inactive") },
            ]}
          />
        </FiltersContainer>

        {selected.length > 0 && (
          <div className="flex gap-2">
            <button
              role="button"
              onClick={async () => {
                try {
                  await usersBulkStatus(selected, true, accessToken);
                  alert(t("users.activated"));
                  setSelected([]);
                  fetchUsers();
                } catch (e) {
                  alert(errorMessage(e));
                }
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("common.activateSelected")}
            </button>
            <button
              role="button"
              onClick={async () => {
                try {
                  await usersBulkStatus(selected, false, accessToken);
                  alert(t("users.deactivated"));
                  setSelected([]);
                  fetchUsers();
                } catch (e) {
                  alert(errorMessage(e));
                }
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              {t("common.deactivateSelected")}
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500">{t("users.loadingList")}</p>
        ) : (
          <UsersListTable
            users={users}
            onDelete={handleDelete}
            selected={selected}
            toggleSelected={toggleSelected}
            toggleAll={toggleAll}
          />
        )}

        <Pagination
          total={total}
          limit={limit}
          offset={offset}
          onPageChange={(newOffset) => setOffset(newOffset)}
        />
      </div>
    </>
  );
}
