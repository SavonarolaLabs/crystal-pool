<script lang="ts">
	import { onMount } from 'svelte';
	import { isDarkMode } from '../ui_state';
	import {initializeChart} from "./chart"

	let chartContainer;
	let chart;

	onMount(() => {
		chartContainer = document.getElementById('chart');
		chart = initializeChart(chartContainer, $isDarkMode);

		const resizeObserver = new ResizeObserver(() => {
			chart.applyOptions({
				width: chartContainer.clientWidth,
				height: chartContainer.clientHeight
			});
		});
		resizeObserver.observe(chartContainer);

		const unsubscribe = isDarkMode.subscribe((value) => {
			chart.remove();
			initializeChart(chartContainer, value);
		});

		return () => {
			unsubscribe();
			chart.remove();
			resizeObserver.disconnect();
		};
	});
</script>

<div>
	<div></div>
	<div id="chart" class="chart"></div>
</div>

<style lang="postcss">
	.chart {

		width: 100%;
	}
</style>
