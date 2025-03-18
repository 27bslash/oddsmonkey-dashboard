import { Typography } from '@mui/material';
import { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import ReactDOM from 'react-dom/client';
import { green } from '@mui/material/colors';
import CustomTooltip from './graphTooltip';
type LineChartProps = {
  labels: string[];
  dataPoints: { [key: string]: number[] };
};
const LineChart = ({ labels, dataPoints }: LineChartProps) => {
  const chartRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(
    null,
  );
  useEffect(() => {
    const tooltipEl = document.createElement('div');
    tooltipEl.id = 'external-tooltip';
    document.body.appendChild(tooltipEl);
    tooltipRef.current = tooltipEl;
    tooltipRootRef.current = ReactDOM.createRoot(tooltipEl);

    return () => {
      tooltipRootRef.current?.unmount();
      tooltipEl.remove();
    };
  }, []);
  const canvasBackground = {
    id: 'canvasBackground',
    beforeDraw: (chart: any) => {
      const { ctx, width, height } = chart;
      ctx.save();
      ctx.fillStyle = '#212121';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },
  };
  const options = {
    responsive: true,
    type: 'line',
    plugins: {
      //   customCanvasBackgroundColor: {
      //     color: '#212121', // whatever color you want
      //   },
      color: 'red',
      tooltip: {
        enabled: false,
        external: (context: any) => {
          const { chart, tooltip } = context;
          const tooltipModel = tooltip;

          if (!tooltipRef.current) return;

          if (tooltipModel.opacity === 0) {
            tooltipRootRef.current?.render(
              <CustomTooltip visible={false} x={0} y={0} content={null} />,
            );
            return;
          }

          const position = chart.canvas.getBoundingClientRect();
          const data = tooltipModel.dataPoints?.[0];
          const x = position.left + window.pageXOffset + tooltipModel.caretX;
          const y =
            position.top + window.pageYOffset + tooltipModel.caretY + 100;
          const smarkets_balance =
            dataPoints.smarkets[tooltip.dataPoints[0].dataIndex];
          const betfair_balance =
            dataPoints.betfair[tooltip.dataPoints[0].dataIndex];

          const content = (
            <>
              <BalanceLabel
                label={data.dataset.label}
                amount={data.formattedValue}
              />
              <BalanceLabel label="Smarkets" amount={smarkets_balance} />
              <BalanceLabel label="Betfair" amount={betfair_balance} />
            </>
          );

          tooltipRootRef.current?.render(
            <CustomTooltip x={x} y={y} content={content} visible={true} />,
          );
        },
      },
    },
    scales: {
      y: {
        // beginAtZero: true,
        ticks: {
          callback: (value: number | string) => `£${value}`,
        },
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Balance',
        data: dataPoints.total,
        borderColor: 'rgb(83, 192, 75)',
        backgroundColor: 'rgb(31, 145, 23)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
      //   {
      //     label: 'Smarkets',
      //     data: dataPoints.smarkets.map((x) => x * 2),
      //     borderColor: 'rgb(75, 184, 192)',
      //     backgroundColor: 'rgb(23, 127, 145)',
      //     borderWidth: 2,
      //     fill: true,
      //     tension: 0.4,
      //   },
      //   {
      //     label: 'betfair',
      //     data: dataPoints.betfair.map((x) => x * 2),
      //     borderColor: 'rgb(182, 192, 75)',
      //     backgroundColor: 'rgb(206, 193, 48)',
      //     borderWidth: 2,
      //     fill: true,
      //     tension: 0.4,
      //   },
    ],
  };

  return <Line data={data} options={options} plugins={[canvasBackground]} />;
};
const BalanceLabel = ({
  label,
  amount,
}: {
  label: string;
  amount: string | number;
}) => {
  return (
    <Typography display={'flex'}>
      <span>{label}</span>
      <span style={{ marginLeft: 'auto', marginRight: 5, color: green['400'] }}>
        £
        {typeof amount === 'number'
          ? amount.toFixed(2)
          : amount.replace(',', '')}
      </span>
    </Typography>
  );
};
export default LineChart;
