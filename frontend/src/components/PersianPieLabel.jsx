import { formatNumber } from "../utils/format.js";

export default function PersianPieLabel({ x, y, textAnchor, value, fill }) {
  return <text x={x} y={y} textAnchor={textAnchor} fill={fill} direction="ltr">{formatNumber(value)}</text>;
}
