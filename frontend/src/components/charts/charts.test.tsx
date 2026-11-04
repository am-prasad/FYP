import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { BarChart } from './BarChart';
import { GroupedBarChart } from './GroupedBarChart';
import { Histogram } from './Histogram';
import { LineChart } from './LineChart';
import { Heatmap } from './Heatmap';

describe('Custom SVG Chart Components', () => {
  it('renders BarChart in horizontal mode with expected number of bars', () => {
    const testData = [
      { label: 'Category A', value: 40 },
      { label: 'Category B', value: 80 },
      { label: 'Category C', value: 60 }
    ];
    const { container } = render(<BarChart data={testData} orientation="horizontal" />);
    const rects = container.querySelectorAll('rect');
    // Each datum has 1 background track rect + 1 value bar rect => 6 rects
    expect(rects.length).toBe(6);
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it('renders BarChart in vertical mode with expected number of bars', () => {
    const testData = [
      { label: 'IQ', value: 6 },
      { label: 'EQ', value: 5 },
      { label: 'SQ', value: 9 },
      { label: 'AQ', value: 4 }
    ];
    const { container } = render(<BarChart data={testData} orientation="vertical" />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(4);
  });

  it('renders GroupedBarChart with expected number of series bars', () => {
    const groups = [
      { groupLabel: 'IQ', values: { High: 10, Avg: 20, Low: 5 } },
      { groupLabel: 'EQ', values: { High: 15, Avg: 18, Low: 2 } }
    ];
    const series = [
      { name: 'High', color: '#10b981' },
      { name: 'Avg', color: '#64748b' },
      { name: 'Low', color: '#ef4444' }
    ];
    const { container } = render(<GroupedBarChart groups={groups} series={series} />);
    const rects = container.querySelectorAll('rect');
    // 2 groups * 3 series = 6 bars
    expect(rects.length).toBe(6);
  });

  it('renders Histogram with expected number of bins', () => {
    const bins = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90-100'];
    const counts = [2, 5, 12, 25, 30, 28, 20, 10, 4, 1];
    const { container } = render(<Histogram bins={bins} counts={counts} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(10);
  });

  it('renders LineChart with expected polylines', () => {
    const series = [
      { name: 'Train Loss', color: '#ef4444', points: [1.2, 0.9, 0.6, 0.4, 0.3] },
      { name: 'Val Accuracy', color: '#10b981', points: [0.3, 0.5, 0.7, 0.8, 0.85] }
    ];
    const { container } = render(<LineChart series={series} />);
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBe(2);
  });

  it('renders Heatmap with expected matrix cells', () => {
    const matrix = [
      [10, 2, 0],
      [1, 12, 1],
      [0, 3, 8]
    ];
    const labels = ['P1', 'P2', 'P3'];
    const { container } = render(<Heatmap matrix={matrix} rowLabels={labels} colLabels={labels} />);
    const rects = container.querySelectorAll('rect');
    // 3 x 3 = 9 cells
    expect(rects.length).toBe(9);
  });
});

