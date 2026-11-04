import React from 'react';

export interface LineSeries {
  name: string;
  color: string;
  points: number[];
}

export interface LineChartProps {
  series: LineSeries[];
  title?: string;
  yLabel?: string;
  xLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  series,
  title,
  yLabel,
  xLabel = 'Epoch'
}) => {
  if (!series || series.length === 0 || series.every((s) => s.points.length === 0)) {
    return <div className="text-sm text-slate-500 py-4">No series data available</div>;
  }

  const numPoints = Math.max(...series.map((s) => s.points.length));
  if (numPoints <= 1) {
    return <div className="text-sm text-slate-500 py-4">Not enough points to display line chart</div>;
  }

  let minVal = Infinity;
  let maxVal = -Infinity;
  series.forEach((s) => {
    s.points.forEach((p) => {
      if (p < minVal) minVal = p;
      if (p > maxVal) maxVal = p;
    });
  });

  if (minVal === Infinity) {
    minVal = 0;
    maxVal = 1;
  }
  if (minVal === maxVal) {
    minVal = Math.max(0, minVal - 0.5);
    maxVal = maxVal + 0.5;
  }

  const chartHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableWidth = 360;
  const chartWidth = paddingLeft + paddingRight + usableWidth;

  const getX = (idx: number) => paddingLeft + (idx / (numPoints - 1)) * usableWidth;
  const getY = (val: number) => paddingTop + usableHeight * (1 - (val - minVal) / (maxVal - minVal));

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
        {series.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-4 h-0.5" style={{ backgroundColor: s.color }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600 font-medium">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[320px] max-h-[300px]"
          role="img"
          aria-label={title || 'Line chart'}
        >
          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const y = paddingTop + usableHeight * (1 - frac);
            const val = minVal + (maxVal - minVal) * frac;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                >
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Series Lines */}
          {series.map((s, sIdx) => {
            if (s.points.length === 0) return null;
            const pathPoints = s.points.map((pt, idx) => `${getX(idx)},${getY(pt)}`).join(' ');

            return (
              <g key={sIdx}>
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pathPoints}
                />
                {/* Dots on key data points (first, last, and every few) */}
                {s.points.map((pt, idx) => {
                  if (idx === 0 || idx === s.points.length - 1 || idx % Math.ceil(numPoints / 10) === 0) {
                    return (
                      <circle
                        key={idx}
                        cx={getX(idx)}
                        cy={getY(pt)}
                        r="3"
                        fill={s.color}
                        stroke="#ffffff"
                        strokeWidth="1"
                      >
                        <title>{`${s.name} - Epoch ${idx + 1}: ${pt.toFixed(4)}`}</title>
                      </circle>
                    );
                  }
                  return null;
                })}
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={paddingLeft}
            y1={paddingTop + usableHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + usableHeight}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <text
            x={chartWidth / 2}
            y={chartHeight - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {xLabel} (Total: {numPoints})
          </text>
          {yLabel && (
            <text
              x={paddingLeft}
              y={paddingTop - 10}
              textAnchor="start"
              fontSize="10"
              fontWeight="500"
              fill="#64748b"
            >
              {yLabel}
            </text>
          )}
        </svg>
      </div>

      <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer hover:underline">View data table</summary>
        <div className="mt-2 max-h-40 overflow-y-auto">
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-1 border border-slate-200">Epoch</th>
                {series.map((s, idx) => (
                  <th key={idx} className="p-1 border border-slate-200">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: numPoints }).map((_, i) => (
                <tr key={i}>
                  <td className="p-1 border border-slate-200">{i + 1}</td>
                  {series.map((s, idx) => (
                    <td key={idx} className="p-1 border border-slate-200">
                      {s.points[i] !== undefined ? s.points[i].toFixed(4) : '-'}
                    </td>
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

