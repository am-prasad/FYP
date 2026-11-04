import React from 'react';

export interface HistogramProps {
  bins: string[];
  counts: number[];
  title?: string;
  color?: string;
}

export const Histogram: React.FC<HistogramProps> = ({
  bins,
  counts,
  title,
  color = '#4f46e5'
}) => {
  if (!bins || !counts || bins.length === 0) {
    return <div className="text-sm text-slate-500 py-4">No histogram data</div>;
  }

  const maxCount = Math.max(...counts, 1);
  const chartHeight = 160;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 35;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableWidth = 280;
  const chartWidth = paddingLeft + paddingRight + usableWidth;
  const binWidth = usableWidth / bins.length;

  return (
    <div className="w-full">
      {title && <h4 className="text-xs font-semibold text-slate-700 mb-1">{title}</h4>}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[260px]"
          role="img"
          aria-label={title || 'Score distribution histogram'}
        >
          {/* Gridlines */}
          {[0, 0.5, 1.0].map((frac, idx) => {
            const y = paddingTop + usableHeight * (1 - frac);
            const gridVal = Math.round(maxCount * frac);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#64748b"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {counts.map((count, idx) => {
            const barH = (count / maxCount) * usableHeight;
            const x = paddingLeft + idx * binWidth;
            const y = paddingTop + usableHeight - barH;

            return (
              <g key={idx}>
                <title>{`Bin ${bins[idx]}: ${count} responses`}</title>
                <rect
                  x={x + 1}
                  y={y}
                  width={Math.max(binWidth - 2, 2)}
                  height={barH}
                  fill={color}
                  rx="1"
                  className="transition-all hover:opacity-80"
                />
                {count > 0 && (
                  <text
                    x={x + binWidth / 2}
                    y={y - 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="600"
                    fill="#334155"
                  >
                    {count}
                  </text>
                )}
                {/* Bin label every other tick */}
                {idx % 2 === 0 && (
                  <text
                    x={x + binWidth / 2}
                    y={paddingTop + usableHeight + 14}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#64748b"
                  >
                    {bins[idx].split('-')[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <details className="mt-1 text-xs text-slate-500">
        <summary className="cursor-pointer hover:underline">View data table</summary>
        <table className="mt-1 w-full text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-1 border border-slate-200">Score Range</th>
              <th className="p-1 border border-slate-200">Count</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((b, i) => (
              <tr key={i}>
                <td className="p-1 border border-slate-200">{b}</td>
                <td className="p-1 border border-slate-200">{counts[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

