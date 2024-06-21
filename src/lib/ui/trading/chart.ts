import { createChart } from 'lightweight-charts';
import { generateHighResolutionData, aggregateData } from './data';

function cssVar(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

export const chartOptionsLight = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: cssVar('--body-background') }
    }
};

export const chartOptionsDark = {
    layout: {
        textColor: 'white',
        background: { type: 'solid', color: '#16171A' }
    },
    grid: {
        vertLines: {
            color: '#1E1E1E'
        },
        horzLines: {
            color: '#1E1E1E'
        }
    }
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
        highResolutionData = generateHighResolutionData(100000);
    }

    const data = aggregateData(highResolutionData, interval);
    candlestickSeries.setData(data);

    chart.timeScale().fitContent();
    return chart;
}
