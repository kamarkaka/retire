import { useEffect, useRef } from 'react';
import { init, use } from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';
use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);
export default function Chart({
  option,
  label,
}: {
  option: EChartsCoreOption;
  label: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chart = init(element.current!, undefined, { renderer: 'canvas' });
    chart.setOption({ ...option, animation: false });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element.current!);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option]);
  return <div className="chart" role="img" aria-label={label} ref={element} />;
}
