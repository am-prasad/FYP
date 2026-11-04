import React from 'react';

export interface SeriesConfig {
  name: string;
  color: string;
}

export interface GroupDatum {
  groupLabel: string;
  values: Record<string, number>;
}

export interface GroupedBarChartProps {
  groups: GroupDatum[];
  series: SeriesConfig[];
  title?: string;
  valueFormatter?: (v: number) => string;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  groups,
  series,
  title,
  valueFormatter = (v) => `${v}`
}) => {
  if (!groups || groups.length === 0) {
    return <div className="text-sm text-slate-500 py-4">No data available</div>;
  }

  let maxVal = 1;
  groups.forEach((g) => {
    series.forEach((s) => {
      const v = g.values[s.name] || 0;
      if (v > maxVal) maxVal = v;
    });
  });

  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = 18;
  const barGap = 4;
  const groupGap = 24;
  const groupWidth = series.length * barWidth + (series.length - 1) * barGap;
  const chartWidth = paddingLeft + paddingRight + groups.length * (groupWidth + groupGap);

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
        {series.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600 font-medium">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[320px] max-h-[300px]"
          role="img"
          aria-label={title || 'Grouped bar chart'}
        >
          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const y = paddingTop + usableHeight * (1 - frac);
            const gridVal = maxVal * frac;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={frac === 0 ? undefined : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                >
                  {Math.round(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Groups */}
          {groups.map((g, gIdx) => {
            const groupX = paddingLeft + gIdx * (groupWidth + groupGap) + groupGap / 2;

            return (
              <g key={gIdx}>
                {series.map((s, sIdx) => {
                  const val = g.values[s.name] || 0;
                  const barH = Math.max((val / maxVal) * usableHeight, 0);
                  const barX = groupX + sIdx * (barWidth + barGap);
                  const barY = paddingTop + usableHeight - barH;

                  return (
                    <g key={sIdx}>
                      <title>{`${g.groupLabel} - ${s.name}: ${valueFormatter(val)}`}</title>
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barH}
                        fill={s.color}
                        rx="2"
                        className="transition-all hover:opacity-80"
                      />
                      {val > 0 && (
                        <text
                          x={barX + barWidth / 2}
                          y={barY - 4}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="600"
                          fill="#334155"
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Group label */}
                <text
                  x={groupX + groupWidth / 2}
                  y={paddingTop + usableHeight + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill="#334155"
                >
                  {g.groupLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Accessible Table Fallback */}
      <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer hover:underline">View data table</summary>
        <table className="mt-2 w-full text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-1 border border-slate-200">Group</th>
              {series.map((s, idx) => (
                <th key={idx} className="p-1 border border-slate-200">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr key={i}>
                <td className="p-1 border border-slate-200 font-medium">{g.groupLabel}</td>
                {series.map((s, idx) => (
                  <td key={idx} className="p-1 border border-slate-200">
                    {valueFormatter(g.values[s.name] || 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

