import { errorMessage } from "../i18n/errors.js";
import { movementTypeLabel, isolateText } from "../i18n/display.js";
import { formatNumber, formatDate } from "../utils/format.js";
import { t } from "../i18n/index.js";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/useAuth";
import Pagination from "../components/Pagination";
import { getStockMovementById, getMovementLines } from "../api/stock_moves";

export default function MovementDetail() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalLines, setTotalLines] = useState(0);

  const [movement, setMovement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMovementData = async () => {
      setIsLoading(true);
      try {
        // Fetch both movement and its lines in parallel
        const [movementData, linesData] = await Promise.all([
          getStockMovementById(id, accessToken),
          getMovementLines(id, accessToken, limit, offset),
        ]);

        setMovement({
          ...movementData,
          lines: linesData.data || [],
        });
        setTotalLines(linesData.total || 0);
      } catch (error) {
        console.error("Error loading movement or its lines:", error);
        alert(errorMessage(error));
        navigate("/stock-movements/list");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovementData();
  }, [id, accessToken, limit, offset, navigate]);

  useEffect(() => {
    document.title = t("breadcrumbs.movementDetail");
  }, []);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Breadcrumb />
        <div className="p-6 text-gray-700">{t("stockMovements.loading")}</div>
      </>
    );
  }

  if (!movement) return null;

  return (
    <>
      <Navbar />
      <Breadcrumb />
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {t("stockMovements.detailTitle", { id: isolateText(movement.id, "ltr") })}
        </h1>
        <button
          role="button"
          onClick={() => navigate("/stock-movements/list")}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4"
        >
          <span aria-hidden="true" className="me-1">→</span>
          {t("common.backToList")}
        </button>

        {/* General info */}
        <div className="mb-6 text-sm text-gray-800">
          <p>
            <strong>{t("common.type") + ':'}</strong>{" "}
            <span className="capitalize">{movementTypeLabel(movement.move_type)}</span>
          </p>
          <p>
            <strong>{t("common.user") + ':'}</strong> <bdi>{movement.user_name}</bdi>
          </p>
          <p>
            <strong>{t("common.date") + ':'}</strong>{" "}
            {formatDate(movement.created_at)}
          </p>
          <p>
            <strong>{t("common.lineCount") + ':'}</strong> {formatNumber(movement.lines.length)}
          </p>
        </div>

        {/* Lines table */}
        <div className="overflow-auto bg-white shadow rounded">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-800">
            <thead className="bg-gray-50 text-start text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">{t("common.product")}</th>
                <th className="px-4 py-2">{t("common.warehouse")}</th>
                <th className="px-4 py-2">{t("common.lot")}</th>
                <th className="px-4 py-2">{t("common.expiration")}</th>
                <th className="px-4 py-2">{t("common.quantity")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movement.lines.map((line) => (
                <tr key={line.line_id}>
                  <td className="px-4 py-2"><bdi dir="ltr">{line.line_id}</bdi></td>
                  <td className="px-4 py-2"><bdi>{line.product_name}</bdi></td>
                  <td className="px-4 py-2"><bdi>{line.warehouse_name}</bdi></td>
                  <td className="px-4 py-2"><bdi dir="ltr">{line.lot}</bdi></td>
                  <td className="px-4 py-2">
                    {formatDate(line.expiration_date)}
                  </td>
                  <td className="px-4 py-2">{formatNumber(line.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          total={totalLines}
          limit={limit}
          offset={offset}
          onPageChange={(newOffset) => setOffset(newOffset)}
        />
      </div>
    </>
  );
}
