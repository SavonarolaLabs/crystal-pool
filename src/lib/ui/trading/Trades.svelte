<div class="trades">
	<div>Market Trades</div>
	<div class="trades_tableHeader">
		<h2 class="trades_column trades_price">Price(USDT)</h2>
		<h2 class="trades_column trades_vol">Amount(BTC)</h2>
		<h2 class="trades_column trades_time">Time</h2>
	</div>
	<div class="trades_body">
		<div class="trades_asks">
			{#each new Array(10) as i}
				<div class="trades_row">
					<div class="trades_price trades_sell">69,001.34</div>
					<div class="trades_vol"><span>1.302628</span></div>
					<div class="trades_time"><span>20:12:32</span></div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="postcss">
	.trades {
		background-color: var(--bg-level-secondary);
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
		width: 37%;
	}
	.trades_vol {
		width: 33%;
		text-align: end;
		-webkit-padding-start: 4px;
		padding-inline-start: 4px;
	}
	.trades_time {
		width: 30%;
		text-align: end;
		position: relative;
		cursor: pointer;
	}

	.trades_body {
	}
	.trades_asks,
	.trades_bids {
		overflow-x: hidden;
		overflow-y: hidden;
		height: calc((100% - 36px) / 2);
		width: 100%;
		font-size: 12px;
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
