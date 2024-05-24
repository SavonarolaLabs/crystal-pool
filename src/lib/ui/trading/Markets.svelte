<div class="markets_wrapper">
	<div class="ant-input-affix-wrapper">search</div>
	<div class="marketTabs_box">
		<div class="styles_nav-item nav-item">Favorite</div>
		<div class="styles_nav-item nav-item">USDC</div>
		<div class="styles_nav-item nav-item mx-scroll-is-active">USDT</div>
		<div class="styles_nav-item nav-item">ETH</div>
		<div class="styles_nav-item nav-item">BTC</div>
		<div class="styles_nav-item nav-item">TUSD</div>
	</div>
	<div class="markets_rowHead markets_row">
		<div class="markets_col1">Pair</div>
		<div class="markets_col2">Price</div>
		<div class="markets_col3">Change</div>
	</div>
	<div class="markets_tbody">
		<div class="scroll-container">
			<div class="markets_rowItem markets_row">
				<div class="markets_col1">
					<div class="markets_symbol">
						<span class="markets_strong">MX</span>
						<span>/USDT</span>
					</div>
					<div class="markets_secondLine">MX Token</div>
				</div>

				<div class="markets_col2">
					<div class="markets_strong">4.5452</div>
					<div class="markets_secondLine">$4.54</div>
				</div>
				<div class="markets_col3">
					<div class="markets_changeUp">+0.24%</div>
					<div class="markets_secondLine">32.68M</div>
				</div>
				<div class="markets_favIcon">
					<svg
						class="svg-icon iconfont"
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
				</div>
			</div>
		</div>
		<div class="scroll-container">
			<div class="markets_rowItem markets_row">
				<div class="markets_col1">
					<div class="markets_symbol">
						<span class="markets_strong">MX</span>
						<span>/USDT</span>
					</div>
					<div class="markets_secondLine">MX Token</div>
				</div>

				<div class="markets_col2">
					<div class="markets_strong">4.5452</div>
					<div class="markets_secondLine">$4.54</div>
				</div>
				<div class="markets_col3">
					<div class="markets_changeUp">+0.24%</div>
					<div class="markets_secondLine">32.68M</div>
				</div>
				<div class="markets_favIcon">
					<svg
						class="svg-icon iconfont"
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
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.markets {
		background-color: lightblue;
	}
	.markets_wrapper {
		width: 100%;
		height: 100%;
		font-size: 12px;
		display: flex;
		flex-flow: column;
	}

	.ant-input {
		--input-icon-hover-color: var(--text-primary);
		--input-padding-vertical-lg: 10.5px;
		--input-padding-vertical-sm: 4px;
		--input-disabled-color: var(--text-disable);
		--input-addon-bg: var(--bg-primary);
		--outline-fade: 20%;
		--input-hover-border-color: var(--primary-5);
	}

	.ant-input-affix-wrapper {
		position: relative;
		display: inline-block;
		width: 100%;
		min-width: 0;
		padding: var(--input-padding-vertical-base)
			var(--input-padding-horizontal-base);
		color: var(--input-color);
		font-size: var(--font-size-base);
		line-height: var(--line-height-base);
		background-color: var(--fill-opacity-container);
		background-image: none;
		border: var(--border-width-base) var(--border-style-base) transparent;
		border-radius: var(--control-border-radius);
		transition: all 0.3s;
		display: inline-flex;
	}

	.marketTabs_box {
		position: relative;
		display: flex;
		font-size: 0;
		min-width: 30px;
		border-bottom: 1px solid var(--divider-primary);
		display: flex;
		padding: 0 16px;
	}
	.mx-scroll-is-active {
		color: var(--text-primary) !important;
		position: relative;
	}

	.styles_scrollTabsWrapper {
		width: 100%;
	}
	.styles_nav-item {
		height: 32px;
		line-height: 32px;
	}

	.nav-item {
		font-size: 14px;
		font-weight: 500;
		height: 39px !important;
		line-height: 39px !important;
		color: var(--text-secondary);
		margin: 0 8px;
	}

	.markets_tbody {
		flex-grow: 1;
		overflow: hidden;
	}
	.scroll-container {
		scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
		scrollbar-width: thin;
		overflow: auto;
		overflow: overlay;
	}
	.markets_row {
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.markets_rowHead {
		color: var(--text-secondary);
		height: 30px;
		flex-shrink: 0;
		-webkit-padding-end: 30px;
		padding-inline-end: 30px;
	}

	.markets_rowItem {
		height: 44px;
		line-height: 20px;
		position: relative;
		color: var(--secondary-text);
		-webkit-padding-end: 30px;
		padding-inline-end: 30px;
	}

	.markets_rowItem:hover {
		background-color: var(--fill-container);
	}
	.markets_col1 {
		width: 50%;
		-webkit-padding-start: 16px;
		padding-inline-start: 16px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.markets_col2 {
		width: 26%;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.markets_col3 {
		width: 24%;
		text-align: end;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.markets_favIcon {
		cursor: pointer;
		color: var(--bg-1);
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		right: 6px;
	}

	.iconfont {
		font-size: 14px;
	}

	.svg-icon {
		width: 1em;
		height: 1em;
		vertical-align: -0.15em;
		fill: currentColor;
		overflow: hidden;
	}

	.markets_symbol {
		display: flex;
		align-items: center;
	}

	.markets_secondLine {
		font-size: 12px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.markets_strong {
		color: var(--title);
	}

	.markets_changeUp {
		color: var(--up);
	}

	.markets_changeDown {
		color: var(--down);
	}
</style>
