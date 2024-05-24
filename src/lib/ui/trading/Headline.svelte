<div class="headline_wrapper">
	<div class="header_wrapper">
		<div class="headline_bigName">BTC/USDT</div>
		<div class="headline_etfDisplay">Bitcoin</div>
		<div class="headline_latestPrice">68,163.62</div>

		<div class="headline_priceBox">
			<div class="headline_etfDisplay">$</div>
			<div class="headline_etfDisplay">68,158.39</div>
		</div>

		<div class="headline_change">-0.11%</div>
		<div class="headline_changeDown">-0.11%</div>
		<div class="headline_changeUp">+3.5%</div>

		<div class="headline_leftItem">
			<div class="headline_withBorder">24h High</div>
			<div class="headline_title">68,635.99</div>
		</div>

		<div class="headline_leftItem">
			<div class="headline_withBorder">24h Low</div>
			<div class="headline_title">66,302.40</div>
		</div>

		<div class="headline_leftItem">
			<div class="headline_withBorder">24h Volume (BTC)</div>
			<div class="headline_title">12.38K</div>
		</div>

		<div class="headline_leftItem">
			<div class="headline_withBorder">24h Amount (USDT)</div>
			<div class="headline_title">836.47M</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.headline {
		background-color: pink;
	}

	.headline_wrapper {
		justify-content: space-between;
		-webkit-padding-start: 10px;
		padding-inline-start: 10px;
		height: 100%;
		color: var(--text-secondary);
	}

	.header_wrapper {
		font-weight: 500;
		font-family:
			-apple-system,
			BlinkMacSystemFont,
			Segoe UI,
			Roboto,
			Helvetica Neue,
			Helvetica,
			Arial,
			sans-serif;
		background-color: var(--bg-secondary);
		color: var(--title);
		font-size: 14px;
		font-feature-settings: 'tnum';
		font-variant: tabular-nums;
		line-height: 1.5715;
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

	.headline_priceBox {
		white-space: normal;
		line-height: 20px;
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

	.headline_leftItem {
		-webkit-margin-end: 15px;
		margin-inline-end: 15px;
		font-size: 12px;
		line-height: 20px;
		white-space: nowrap;
	}

	.headline_withBorder {
		border-bottom: 1px dashed transparent;
		color: var(--text-secondary);
	}

	.headline_title {
		color: var(--text-primary);
	}

	.headline_change {
		color: var(--title);
		-webkit-margin-start: 4px;
		margin-inline-start: 4px;
	}
	.headline_changeDown {
		color: var(--down);
	}
	.headline_changeUp {
		color: var(--up);
	}
</style>
