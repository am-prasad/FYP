import React from 'react';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  note?: string;
}

export interface BarChartProps {
  data: BarDatum[];
  orientation?: 'horizontal' | 'vertical';
  max?: number;
  valueFormatter?: (val: number) => string;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  orientation = 'horizontal',
  max,
  valueFormatter = (v) => `${v}`,
  title
}) => {
  if (!data || data.length === 0) {
    return <div className="text-sm text-slate-500 py-4">No data available</div>;
  }

  const computedMax = max !== undefined ? max : Math.max(...data.map((d) => d.value), 1);

  if (orientation === 'vertical') {
    const chartHeight = 220;
    const paddingLeft = 45;
    const paddingBottom = 40;
    const paddingTop = 20;
    const paddingRight = 20;
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    const barWidth = 32;
    const gap = 20;
    const chartWidth = paddingLeft + paddingRight + data.length * (barWidth + gap);

    return (
      <div className="w-full">
        {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[320px] max-h-[300px]"
            role="img"
            aria-label={title || 'Vertical bar chart'}
          >
            {/* Horizontal gridlines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
              const y = paddingTop + usableHeight * (1 - frac);
              const gridVal = computedMax * frac;
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

            {/* Bars */}
            {data.map((d, idx) => {
              const x = paddingLeft + idx * (barWidth + gap) + gap / 2;
              const barHeight = Math.max((d.value / computedMax) * usableHeight, 0);
              const y = paddingTop + usableHeight - barHeight;
              const barColor = d.color || '#3b82f6';

              return (
                <g key={idx}>
                  <title>{`${d.label}: ${valueFormatter(d.value)}${d.note ? ` (${d.note})` : ''}`}</title>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    rx="3"
                    className="transition-all hover:opacity-80"
                  />
                  {/* Value label on top of bar */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#334155"
                  >
                    {valueFormatter(d.value)}
                  </text>
                  {/* Category label below baseline */}
                  <text
                    x={x + barWidth / 2}
                    y={paddingTop + usableHeight + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#475569"
                    className="truncate"
                  >
                    {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Accessible Data Table fallback */}
        <details className="mt-2 text-xs text-slate-500">
          <summary className="cursor-pointer hover:underline">View data table</summary>
          <table className="mt-2 w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-1 border border-slate-200">Category</th>
                <th className="p-1 border border-slate-200">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}>
                  <td className="p-1 border border-slate-200">{d.label}</td>
                  <td className="p-1 border border-slate-200">{valueFormatter(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    );
  }

  // Horizontal layout
  const barHeight = 24;
  const gap = 12;
  const paddingLeft = 140;
  const paddingRight = 60;
  const paddingTop = 15;
  const paddingBottom = 20;
  const usableWidth = 400;
  const totalWidth = paddingLeft + usableWidth + paddingRight;
  const totalHeight = paddingTop + paddingBottom + data.length * (barHeight + gap);

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="w-full h-auto"
          role="img"
          aria-label={title || 'Horizontal bar chart'}
        >
          {/* Vertical gridlines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const x = paddingLeft + usableWidth * frac;
            return (
              <line
                key={idx}
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={totalHeight - paddingBottom}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Bars */}
          {data.map((d, idx) => {
            const y = paddingTop + idx * (barHeight + gap);
            const w = Math.max((d.value / computedMax) * usableWidth, 0);
            const barColor = d.color || '#3b82f6';

            return (
              <g key={idx}>
                <title>{`${d.label}: ${valueFormatter(d.value)}${d.note ? ` (${d.note})` : ''}`}</title>
                {/* Category Label */}
                <text
                  x={paddingLeft - 10}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="500"
                  fill="#475569"
                >
                  {d.label.length > 20 ? `${d.label.slice(0, 19)}…` : d.label}
                </text>
                {/* Background track */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={usableWidth}
                  height={barHeight}
                  fill="#f1f5f9"
                  rx="4"
                />
                {/* Colored Value Bar */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={w}
                  height={barHeight}
                  fill={barColor}
                  rx="4"
                  className="transition-all hover:opacity-85"
                />
                {/* Value Text */}
                <text
                  x={paddingLeft + w + 8}
                  y={y + barHeight / 2 + 4}
                  fontSize="12"
                  fontWeight="600"
                  fill="#1e293b"
                >
                  {valueFormatter(d.value)}
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
              <th className="p-1 border border-slate-200">Category</th>
              <th className="p-1 border border-slate-200">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td className="p-1 border border-slate-200">{d.label}</td>
                <td className="p-1 border border-slate-200">{valueFormatter(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

