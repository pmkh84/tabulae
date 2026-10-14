import { t } from "../i18n/index.js";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p role="status" className="p-6">{t("common.loading")}</p>;

  if (user?.role !== "admin") {
    alert(t("errors.forbidden"));
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
