<script>
	import MockTrades from '../MockTrades.svelte';
	import Actions from './Actions.svelte';
	import Chart from './Chart.svelte';
	import Headline from './Headline.svelte';
	import MarketTrades from './MarketTrades.svelte';
	import Markets from './Markets.svelte';
	import OrderBook from './OrderBook.svelte';
	import Orders from './Orders.svelte';
    import { Toaster } from 'svelte-french-toast';
</script>
<Toaster />
<!-- <MockTrades /> -->
<div class="exchange_pageWrapper">
    <div class="exchange">
	<!-- left -->
	<div class="orderbook">
		<OrderBook></OrderBook>
	</div>
	<!-- top center -->
	<div class="headline">
		<Headline></Headline>
	</div>
    <!-- top center -->
    <div class="chart">
        <Chart></Chart>
    </div>
    <!-- top right -->
    <div class="markets">
        <Markets></Markets>
    </div>
    <!-- bottom center -->
    <div class="actions">
        <Actions></Actions>
    </div>
    <!-- bottom right -->
    <div class="trades">
        <MarketTrades></MarketTrades>
    </div>
    <!-- bottom -->
    <div class="orders">
        <Orders></Orders>
    </div>
</div>
</div>

<style lang="postcss">
    .exchange_pageWrapper{
        background-color: var(--bg-level-primary);
    }
    .exchange{
        display: grid;
        grid-column-gap: 5px;
        grid-row-gap: 5px;
        justify-items: stretch;
        align-items: stretch;
        padding: 5px 0;
        max-width: 1520px;
        min-width: 760px;
        margin: 0 auto;
        grid-template-columns: minmax(350px,1fr) minmax(auto,2.5fr) minmax(380px,1fr);
        grid-template-rows: 44px 410px 380px 330px;
    }
    .orderbook{
        rid-column: 1 / 2;
        grid-row: 1 / 4;
        background-color: var(--bg-level-secondary);
    }
    .headline{
        grid-column: 2 / 3;
        grid-row: 1 / 2;
        background-color: var(--bg-level-secondary);
    }
    .chart{
        grid-column: 2 / 3;
        grid-row: 2 / 3;
        background-color: var(--bg-level-secondary);
    }
    .actions{
        grid-column: 2 / 3;
        grid-row: 3 / 4;
        background-color: var(--bg-level-secondary);
    }
    .markets{
        grid-column: 3 / 4;
        grid-row: 1 / 3;
        background-color: var(--bg-level-secondary);
    }
    .trades{
        grid-column: 3 / 4;
        grid-row: 3 / 4;
        background-color: var(--bg-level-secondary);

        position: relative;
		display: flex;
		flex-flow: column nowrap;
		z-index: 2;
    }
    .orders{
        grid-column: 1 / 4;
        grid-row: 4 / 5;
        background-color: var(--bg-level-secondary);
    }
</style>
