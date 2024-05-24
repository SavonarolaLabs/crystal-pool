<script>
	import Actions from './Actions.svelte';
	import Chart from './Chart.svelte';
	import Headline from './Headline.svelte';
	import Markets from './Markets.svelte';
	import OrderBook from './OrderBook.svelte';
	import Orders from './Orders.svelte';
	import Trades from './Trades.svelte';
</script>

<div class="exchange">
	<!-- left -->
	<div class="orderbook">
		<OrderBook></OrderBook>
	</div>
	<!-- top center -->
	<div class="headline">
		<Headline></Headline>
	</div>
</div>

<style lang="postcss">
	.exchange {
		display: grid;
		grid-column-gap: 5px;
		grid-row-gap: 5px;
		justify-items: stretch;
		align-items: stretch;
		padding: 5px 0;
		max-width: 1520px;
		min-width: 760px;
		margin: 0 auto;
		grid-template-columns: minmax(350px, 1fr) minmax(auto, 2.5fr) minmax(
				380px,
				1fr
			);
		grid-template-rows: 44px 410px 380px 330px;
	}

	.headline_bigName {
		line-height: 20px;
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary);
		//margin: 0;
	}
	.headline_latestPrice {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary);
	}

	.headline_etfDisplay {
		font-size: 12px;
		font-weight: 400;
		color: var(--text-secondary);
		max-width: 140px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		cursor: pointer;
		-webkit-margin-end: 10px;
		margin-inline-end: 10px;
	}
</style>
