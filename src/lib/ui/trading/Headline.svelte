<div class="exchange_headline_wrapper">
	<div class="header_wrapper">
		<div class="headline_left">
			<div class="headline_symbolName">
				<svg
					class="svg-icon iconfont headline_favorite"
					focusable="false"
					width="1em"
					height="1em"
					fill="currentColor"
					aria-hidden="true"
					viewBox="0 0 1024 1024"
					data-icon="StarFilled"
					><path
						d="M908.096 353.088l-253.888-36.864-113.536-230.08a32.128 32.128 0 0 0-57.408 0L369.792 316.16l-253.888 36.864a32 32 0 0 0-17.728 54.656l183.68 179.072-43.392 252.864a32 32 0 0 0 46.4 33.728L512 753.984l227.072 119.424a32 32 0 0 0 46.4-33.728l-43.392-252.864 183.68-179.072a31.936 31.936 0 0 0-17.664-54.656z"
					></path></svg
				>
				<div>
					<div class="headline_bigName">rsBTC/sigUSD</div>
					<div class="headline_etfDisplay">Bitcoin</div>
				</div>
				<div class="headline_divider"></div>
			</div>
			<div class="headline_leftItem">
				<div>
					<span class="headline_title headline_latestPrice"
						>69,450.01</span
					><span class="headline_change headline_changeUp">
						+1.62%</span
					>
				</div>
				<div class="headline_priceBox">
					<span dir="ltr">
						<span style="margin-inline-end: 2px">$</span>
						<span dir="ltr">69,406.50</span>
					</span>
				</div>
			</div>

			<div class="scroll-subtabs_scrollSubInfo">
				<div class="scroll-subtabs_tabs">
					<div class="scroll-subtabs_subMarketWrap">
						<div class="subtabs_infoWrapper">
							<div class="subtabs_leftItem">
								<div class="headline_withBorder">24h High</div>
								<div class="headline_title">69,600.00</div>
							</div>
							<div class="subtabs_leftItem">
								<div class="headline_withBorder">24h Low</div>
								<div class="headline_title">66,302.40</div>
							</div>

							<div class="subtabs_leftItem">
								<div class="headline_withBorder">
									24h Volume (rsBTC)
								</div>
								<div class="headline_title">12.38K</div>
							</div>
							<div class="subtabs_leftItem">
								<div class="headline_withBorder">
									24h Amount (sigUSD)
								</div>
								<div class="headline_title">836.47M</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.exchange_headline_wrapper {
		background-color: var(--bg-level-secondary);
	}

	.header_wrapper {
		display: flex;
		align-items: center;
		justify-content: space-between;
		-webkit-padding-start: 10px;
		padding-inline-start: 10px;
		height: 44px;
		color: var(--text-secondary);
		font-weight: 500;
		font-size: 14px;
		font-feature-settings: 'tnum';
		font-variant: tabular-nums;
		line-height: 1.5715;
	}

	.headline_left {
		flex: 1 1;
		display: flex;
		align-items: center;
	}

	.headline_symbolName {
		white-space: nowrap;
		display: flex;
		align-items: center;
		position: relative;
	}
	.headline_divider {
		width: 1px;
		height: 28px;
		background-color: var(--divider-secondary);
		margin: 0 16px;
	}

	.headline_bigName {
		line-height: 20px;
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary);
	}
	.headline_etfDisplay {
		line-height: 14px;
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

	.headline_title {
		color: var(--text-primary);
	}
	.headline_latestPrice {
		font-size: 16px;
		font-weight: 700;
	}

	.headline_priceBox {
		line-height: 14px;
		margin-top: 2px;
	}

	.scroll-subtabs_scrollSubInfo {
		flex: 1 1;
		width: 0;
		-webkit-margin-end: 30px;
		margin-inline-end: 30px;
		position: relative;
	}
	.scroll-subtabs_tabs {
		flex-flow: row nowrap;
		display: flex;
		overflow: hidden;
		position: relative;
	}
	.scroll-subtabs_subMarketWrap {
		overflow: auto hidden;
		white-space: nowrap;
		scroll-behavior: smooth;
		scrollbar-width: none;
	}
	.subtabs_infoWrapper {
		display: flex;
		align-items: center;
	}

	.subtabs_infoWrapper {
		display: flex;
		align-items: center;
	}

	.subtabs_leftItem {
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
	.headline_favorite {
		color: var(--text-tertiary);
		cursor: pointer;
		-webkit-margin-start: 6px;
		margin-inline-start: 6px;
		-webkit-margin-end: 8px;
		margin-inline-end: 8px;
	}

	.iconfont {
		font-size: 16px;
		font-style: normal;
		-webkit-font-smoothing: antialiased;
	}

	.svg-icon {
		width: 1em;
		height: 1em;
		vertical-align: -0.15em;
		fill: currentColor;
		overflow: hidden;
	}
</style>
