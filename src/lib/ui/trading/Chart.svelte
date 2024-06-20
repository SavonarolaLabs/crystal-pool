<script>
	import { onMount } from 'svelte';
	import { createChart } from 'lightweight-charts';
	import { isDarkMode } from '../ui_state';

	let chartContainer;
	let chart;
	let lineSeries;

	const customData = [
		{ time: '2024-06-19', value: 100 },
		{ time: '2024-06-20', value: 101 }
		// Add your custom data points here
	];

	function cssVar(variableName) {
		return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
	}

	function initializeChart(darkMode) {
		const chartOptionsLight = { layout: { textColor: 'black', background: { type: 'solid', color: cssVar('--body-background') } } }
		const chartOptionsDark = {
			layout: {
				textColor: 'white',
				background: { type: 'solid', color: cssVar('--body-background') }
			},
      grid: {
        vertLines: {
          color: '#1E1E1E',
        },
        horzLines: {
          color: '#1E1E1E',
        },
      },
		};

		if (darkMode) {
			chart = createChart(chartContainer, chartOptionsDark);
		} else {
			chart = createChart(chartContainer, chartOptionsLight);
		}
		const areaSeries = chart.addAreaSeries({
			lineColor: '#2962FF',
			topColor: '#2962FF',
			bottomColor: 'rgba(41, 98, 255, 0.28)'
		});
		areaSeries.setData([
			{ time: '2018-12-22', value: 32.51 },
			{ time: '2018-12-23', value: 31.11 },
			{ time: '2018-12-24', value: 27.02 },
			{ time: '2018-12-25', value: 27.32 },
			{ time: '2018-12-26', value: 25.17 },
			{ time: '2018-12-27', value: 28.89 },
			{ time: '2018-12-28', value: 25.46 },
			{ time: '2018-12-29', value: 23.92 },
			{ time: '2018-12-30', value: 22.68 },
			{ time: '2018-12-31', value: 22.67 }
		]);

		const candlestickSeries = chart.addCandlestickSeries({
			upColor: '#26a69a',
			downColor: '#ef5350',
			borderVisible: false,
			wickUpColor: '#26a69a',
			wickDownColor: '#ef5350'
		});
		candlestickSeries.setData([
			{ time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
			{ time: '2018-12-23', open: 45.12, high: 53.9, low: 45.12, close: 48.09 },
			{ time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
			{ time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.5 },
			{ time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
			{ time: '2018-12-27', open: 91.04, high: 121.4, low: 82.7, close: 111.4 },
			{ time: '2018-12-28', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
			{ time: '2018-12-29', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
			{ time: '2018-12-30', open: 106.33, high: 110.2, low: 90.39, close: 98.1 },
			{ time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 111.26 }
		]);

		chart.timeScale().fitContent();
	}

	onMount(() => {
		chartContainer = document.getElementById('chart');
		initializeChart($isDarkMode);

		const resizeObserver = new ResizeObserver(() => {
			chart.applyOptions({ width: chartContainer.clientWidth, height: chartContainer.clientHeight });
		});
		resizeObserver.observe(chartContainer);

		const unsubscribe = isDarkMode.subscribe((value) => {
			chart.remove();
			initializeChart(value);
		});

		return () => {
			unsubscribe();
			chart.remove();
			resizeObserver.disconnect();
		};
	});

	function toggleTheme() {
		isDarkMode.update((n) => !n);
	}
</script>

<div id="chart" class="chart"></div>

<button on:click={toggleTheme}> Toggle Theme </button>

<style lang="postcss">
	.chart {
		height: 100%;
		width: 100%;
	}

	button {
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 10px;
	}
</style>
