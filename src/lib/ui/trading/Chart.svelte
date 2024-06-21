<script lang="ts">
	import { onMount } from 'svelte';
	import { isDarkMode } from '../ui_state';
	import { initializeChart } from './chart';

	let chartContainer;
	let chart;
	let intervalOptions = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];
	let selectedInterval = '1D';

	function selectInterval(interval) {
		selectedInterval = interval;
		chart.remove();
		chart = initializeChart(chartContainer, $isDarkMode, selectedInterval);
	}

	onMount(() => {
		chartContainer = document.getElementById('chart');
		chart = initializeChart(chartContainer, $isDarkMode, selectedInterval);

		const resizeObserver = new ResizeObserver(() => {
			chart.applyOptions({
				width: chartContainer.clientWidth,
				height: chartContainer.clientHeight
			});
		});
		resizeObserver.observe(chartContainer);

		const unsubscribe = isDarkMode.subscribe((value) => {
			chart.remove();
			chart = initializeChart(chartContainer, value, selectedInterval);
		});

		return () => {
			unsubscribe();
			chart.remove();
			resizeObserver.disconnect();
		};
	});
</script>

<div class="flex flex-col w-full h-full">
	<div class="interval_wrapper">
		{#each intervalOptions as i}
			<button on:click={() => selectInterval(i)} class:interval_active={selectedInterval == i}>{i}</button>
		{/each}
	</div>
	<div id="chart" class="chart grow-1"></div>
</div>

<style lang="postcss">
	.interval_wrapper button {
		padding: 0 6px;
		height: 24px;
		transition: all 0.16s ease-in;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		white-space: nowrap;
		border-radius: 4px;
	}
	.interval_active {
		color: var(--text-primary);
		background: var(--fill-opacity-container);
	}
	.interval_wrapper {
		height: 40px;
		@apply flex gap-2 items-center pl-4;
		color: var(--text-secondary);
		font-size: 12px;
	}
	.interval_wrapper:not(:first-child) {
		-webkit-margin-start: 4px;
		margin-inline-start: 4px;
	}
	.chart {
		height: 100%;
		width: 100%;
	}
</style>
