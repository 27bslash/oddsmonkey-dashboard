import { Typography } from '@mui/material';
import { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import ReactDOM from 'react-dom/client';
import { green, red } from '@mui/material/colors';
import CustomTooltip from './graphTooltip';
import { Padding } from '@mui/icons-material';
type LineChartProps = {
  labels: string[];
  dataPoints: { [key: string]: number[] };
  overrides: Record<string, number>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};
const LineChart = ({
  labels,
  dataPoints,
  overrides,
  setOverrides,
}: LineChartProps) => {
  const chartRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipRootRef = useRef<ReturnType<typeof ReactDOM.createRoot> | null>(
    null,
  );
  const [clickedPoint, setClickedPoint] = useState<{
    x: number;
    y: number;
    index: number;
    datasetIndex: number;
  } | null>(null);
  const [showHoverTooltip, setShowHoverTooltip] = useState(true);
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

    onHover: (event: any, chartElement: any[]) => {
      const target = event?.native?.target || event?.target;
      if (target) {
        if (chartElement && chartElement.length > 0) {
          target.style.cursor = 'pointer';
        } else {
          target.style.cursor = 'default';
        }
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements && elements.length > 0) {
        const { index, datasetIndex } = elements[0];
        console.log('onClick', index, datasetIndex);
        const chart = chartRef.current;
        if (chart) {
          const meta = chart.getDatasetMeta(datasetIndex);
          const point = meta.data[index];
          const rect = chart.canvas.getBoundingClientRect();
          setClickedPoint({
            x: rect.left + window.pageXOffset + point.x - 200,
            y: rect.top + window.pageYOffset + point.y - 80,
            index,
            datasetIndex,
          });
          setShowHoverTooltip(false); // Hide hover tooltip on click
          console.log(data);
        }
      } else {
        setClickedPoint(null);
        setShowHoverTooltip(true); // Show hover tooltip again if nothing is clicked
      }
    },
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

          if (!showHoverTooltip || tooltipModel.opacity === 0) {
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
  const pointColors = labels.map((label, idx) => {
    // idx === clickedPoint?.index ? 'red' : 'rgb(83, 192, 75)',
    if (idx === clickedPoint?.index) {
      return red['700'];
    } else if (
      Object.keys(overrides).includes(label) &&
      overrides[label] !== 0
    ) {
      return 'cyan';
    }
    return 'rgb(83, 192, 75)';
  });
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
        pointRadius: 3,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
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
  const [inputValue, setInputValue] = useState<string>('0');
  useEffect(() => {
    if (!clickedPoint) return;
    console.log(
      'clickedPoint',
      clickedPoint,
      clickedPoint.index,
      labels[clickedPoint.index],
      overrides,
      overrides[labels[clickedPoint.index]],
    );
    setInputValue(overrides[labels[clickedPoint.index]] || '0');
  }, [clickedPoint]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDate = labels[clickedPoint!.index];
    const value = parseFloat(inputValue);

    const update = { $set: { [`overrides.${targetDate}`]: value } };
    const collectionName = 'true_balance_override';
    const query = {};
    setOverrides((prev) => ({
      ...prev,
      [targetDate]: value,
    }));
    window.electron.ipcRenderer.updateItem({
      collectionName,
      query,
      update,
    });
  };

  return (
    <>
      {clickedPoint && (
        <CustomTooltip
          x={clickedPoint.x}
          y={clickedPoint.y}
          visible={true}
          content={
            <div>
              <BalanceLabel
                label={'Total Balance:'}
                amount={
                  data.datasets[clickedPoint.datasetIndex].data[
                    clickedPoint.index
                  ]
                }
              />
              <Typography display={'flex'}>
                <span>Date: </span>
                <span style={{ marginLeft: 'auto', marginRight: 5 }}>
                  {labels[clickedPoint.index]}
                </span>
              </Typography>
              <form onSubmit={(e) => handleSubmit(e)}>
                <input
                  type="number"
                  placeholder="edit"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </form>
            </div>
          }
        />
      )}
      <Line
        ref={chartRef}
        data={data}
        options={options}
        plugins={[canvasBackground]}
      />
    </>
  );
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
