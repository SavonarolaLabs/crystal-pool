import { createChart } from 'lightweight-charts';
import { generateHighResolutionData, aggregateData } from './data';

function cssVar(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

export const chartOptionsLight = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' }
    },
    timeScale: { barSpacing: 10 }
};

export const chartOptionsDark = {
    layout: {
        textColor: '#87909f',
        background: { type: 'solid', color: '#16171A' }
    },
    grid: {
        vertLines: {
            color: '#1E1E1E'
        },
        horzLines: {
            color: '#1E1E1E'
        }
    },
    timeScale: { barSpacing: 10 }
};

let highResolutionData;

export function initializeChart(chartContainer, darkMode, interval) {
    let chart;
    if (darkMode) {
        chart = createChart(chartContainer, chartOptionsDark);
    } else {
        chart = createChart(chartContainer, chartOptionsLight);
    }

    const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350'
    });

    if (!highResolutionData) {
        highResolutionData = generateHighResolutionData(100_000);
    }

    const data = aggregateData(highResolutionData, interval);
    candlestickSeries.setData(data);

    return chart;
}
