import React from 'react';

export interface HeatmapProps {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  title?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  matrix,
  rowLabels,
  colLabels,
  title
}) => {
  if (!matrix || matrix.length === 0 || !matrix[0] || matrix[0].length === 0) {
    return <div className="text-sm text-slate-500 py-4">No confusion matrix data</div>;
  }

  let maxVal = 1;
  matrix.forEach((row) => {
    row.forEach((v) => {
      if (v > maxVal) maxVal = v;
    });
  });

  const numRows = matrix.length;
  const numCols = matrix[0].length;
  const cellSize = 36;
  const paddingLeft = 110;
  const paddingTop = 90;
  const paddingRight = 20;
  const paddingBottom = 40;

  const chartWidth = paddingLeft + paddingRight + numCols * cellSize;
  const chartHeight = paddingTop + paddingBottom + numRows * cellSize;

  const getCellColor = (val: number, isDiag: boolean) => {
    if (val === 0) return '#f8fafc';
    const intensity = Math.min(val / maxVal, 1.0);
    // Greenish for diagonal, bluish-slate for non-diagonal
    if (isDiag) {
      return `rgba(31, 157, 122, ${0.2 + intensity * 0.8})`;
    }
    return `rgba(224, 122, 31, ${0.2 + intensity * 0.75})`;
  };

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[420px]"
          role="img"
          aria-label={title || 'Confusion matrix heatmap'}
        >
          {/* Axis headers */}
          <text
            x={paddingLeft + (numCols * cellSize) / 2}
            y={20}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#1e293b"
          >
            Predicted Profile
          </text>
          <text
            x={15}
            y={paddingTop + (numRows * cellSize) / 2}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="#1e293b"
            transform={`rotate(-90, 15, ${paddingTop + (numRows * cellSize) / 2})`}
          >
            Actual Profile
          </text>

          {/* Column labels (Rotated) */}
          {colLabels.map((lbl, cIdx) => {
            const x = paddingLeft + cIdx * cellSize + cellSize / 2;
            const y = paddingTop - 8;
            return (
              <text
                key={cIdx}
                x={x}
                y={y}
                textAnchor="start"
                fontSize="10"
                fill="#475569"
                transform={`rotate(-45, ${x}, ${y})`}
              >
                {lbl.length > 12 ? `${lbl.slice(0, 11)}…` : lbl}
              </text>
            );
          })}

          {/* Row labels & Cells */}
          {matrix.map((row, rIdx) => {
            const rowY = paddingTop + rIdx * cellSize;
            const rLabel = rowLabels[rIdx] || `P${rIdx + 1}`;

            return (
              <g key={rIdx}>
                {/* Row label */}
                <text
                  x={paddingLeft - 8}
                  y={rowY + cellSize / 2 + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#475569"
                >
                  {rLabel.length > 14 ? `${rLabel.slice(0, 13)}…` : rLabel}
                </text>

                {/* Cells */}
                {row.map((val, cIdx) => {
                  const cellX = paddingLeft + cIdx * cellSize;
                  const isDiag = rIdx === cIdx;
                  const cellBg = getCellColor(val, isDiag);
                  const isDark = val / maxVal > 0.55;

                  return (
                    <g key={cIdx}>
                      <title>{`Actual: ${rLabel} | Predicted: ${colLabels[cIdx]} | Count: ${val}`}</title>
                      <rect
                        x={cellX}
                        y={rowY}
                        width={cellSize - 1}
                        height={cellSize - 1}
                        fill={cellBg}
                        rx="2"
                        stroke="#cbd5e1"
                        strokeWidth="0.5"
                      />
                      <text
                        x={cellX + cellSize / 2}
                        y={rowY + cellSize / 2 + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={val > 0 ? '600' : '400'}
                        fill={isDark ? '#ffffff' : val > 0 ? '#0f172a' : '#94a3b8'}
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer hover:underline">View data table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-1 border border-slate-200">Actual \ Predicted</th>
                {colLabels.map((c, i) => (
                  <th key={i} className="p-1 border border-slate-200">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, r) => (
                <tr key={r}>
                  <td className="p-1 border border-slate-200 font-medium">{rowLabels[r]}</td>
                  {row.map((val, c) => (
                    <td key={c} className="p-1 border border-slate-200">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

