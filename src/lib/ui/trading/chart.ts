import { createChart } from 'lightweight-charts';
import { generateRandomData } from './data';

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

export function initializeChart(chartContainer, darkMode) {
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
    candlestickSeries.setData(generateRandomData(100000));

    chart.timeScale().fitContent();
    return chart;
}