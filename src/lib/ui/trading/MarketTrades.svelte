<script>
	import { market_trades } from '../ui_state';
</script>

	<div class="tab">Market Trades</div>
	<div class="trades_tableHeader">
		<h2 class="trades_column trades_price">Price(sigUSD)</h2>
		<h2 class="trades_column trades_vol">Amount(rsBTC)</h2>
		<h2 class="trades_column trades_time">Time</h2>
	</div>
		<div class="trades_asks">
			{#each $market_trades as trade}
				<div class="trades_row">
					<div
						class="trades_price"
						class:trades_sell={trade.side == 'sell'}
						class:trades_buy={trade.side == 'buy'}
					>
						{trade.price}
					</div>
					<div class="trades_vol"><span>{trade.amount}</span></div>
					<div class="trades_time"><span>{trade.time}</span></div>
				</div>
			{/each}
		</div>

<style lang="postcss">
	.tab {
		display: flex;
		margin: 4px 0;
		margin-inline-start: 10px;
		heigh: 32px;
		line-height: 32px;
		padding-inline-start: 6px;
	}
	.trades {
		position: relative;
		display: flex;
		flex-flow: column nowrap;
		z-index: 2;
	}
	.trades_controller {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 24px;
		padding: 0 16px;
		margin-top: 2px;
	}
	.trades_dirWrapper {
		display: flex;
	}
	.trades_drop {
		cursor: pointer;
		display: flex;
		align-items: center;
		background-color: var(--fill-container);
		color: var(--text-primary);
		font-size: 12px;
		border-radius: 2px;
		padding: 0 4px 0 6px;
		height: 24px;
	}
	.trades_tableHeader {
		display: flex;
		align-items: center;
		height: 30px;
		position: relative;
		overflow: hidden;
		padding: 6px 0 2px;
	}
	.trades_column {
		color: var(--text-secondary);
		white-space: nowrap;
		margin-bottom: 0;
		font-size: 12px;
		font-weight: 400;
	}
	.trades_price {
		padding-inline-start: 16px;
		width: 37%;
	}
	.trades_vol {
		width: 33%;
		text-align: end;
		-webkit-padding-start: 4px;
		padding-inline-start: 4px;
	}
	.trades_time {
		padding-inline-end: 10px;
		width: 30%;
		text-align: end;
		position: relative;
		cursor: pointer;
	}

	.trades_body {
		position: relative;
		display: flex;
		flex-flow: column nowrap;
		z-index: 2;
	}
	.trades_asks {
		overflow: auto;
		flex-grow: 1;
		overscroll-behavior-y: contain;
	}
	.trades_row {
		display: flex;
		height: 20px;
		line-height: 20px;
		overflow: hidden;
		position: relative;
	}

	.trades_sell {
		color: var(--down);
	}
	.trades_buy {
		color: var(--up);
	}

	.trades_newPrice {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.trades_bigPrice {
		font-size: 16px;
		font-weight: 700;
		display: flex;
		align-items: center;
	}
	.trades_sell .trades_updownArrow {
		transform: rotate(90deg);
		opacity: 1;
	}
	.trades_buy .trades_updownArrow {
		transform: rotate(270deg);
		opacity: 1;
	}
	.trades_fiatPrice {
		font-size: 12px;
		color: var(--primary-text);
		-webkit-margin-start: 5px;
		margin-inline-start: 5px;
	}
</style>
