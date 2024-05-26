<div class="exchange_ordersWrapper">
	<section class="orders_tableWrapper">
		<div class="orders_header">
			<div class="orders_headerLeft">
				<div class="scroll-subtabs_scrollSubInfo">
					<div class="scroll-subtabs_tabs">
						<div class="scroll-subtabs_subMarketWrap">
							<div class="orders_headerLeftWrapper">
								<div class="orders_tab orders_tab-active">
									Open orders
								</div>
								<div class="orders_tab">Order history</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="orders_headerRight">
				<div class="orders_showCurrent">
					<label
						class="ant-checkbox-wrapper"
						style="color: var(--text-secondary);"
					>
						<span class="ant-checkbox"
							><input
								type="checkbox"
								class="ant-checkbox-input"
								value=""
							/>
							<span class="ant-checkbox-inner"></span>
						</span>
						<span style="font-size: 12px;">Hide Other Pairs</span>
					</label>
				</div>
			</div>
		</div>
		<section>
			<section class="orders_listBodyContent">
				<div class="orders_tableHeader">
					<div class="orders_cell orders_symbol">Trading Pair</div>
					<div class="orders_cell orders_date">
						<span class="sort-caret_sortWrapper"
							><span>Time</span><span class="sort-caret_sort"
								><svg
									class="sort-caret_caret svg-icon"
									focusable="false"
									width="1em"
									height="1em"
									fill="currentColor"
									aria-hidden="true"
									viewBox="0 0 10 4"
									data-icon="SortTop"
									><path
										d="M5.24563 0.351099L7.39711 3.42464C7.5363 3.62348 7.39405 3.89668 7.15134 3.89668L2.84838 3.89668C2.60567 3.89668 2.46343 3.62348 2.60261 3.42465L4.75409 0.351099C4.87352 0.180484 5.1262 0.180484 5.24563 0.351099Z"
										fill="currentColor"
									></path></svg
								><svg
									class="sort-caret_caret svg-icon sort-caret_active"
									focusable="false"
									width="1em"
									height="1em"
									fill="currentColor"
									aria-hidden="true"
									viewBox="0 0 10 4"
									data-icon="SortDown"
									><path
										d="M5.24563 3.6489L7.39711 0.575355C7.5363 0.376522 7.39405 0.103317 7.15134 0.103317L2.84838 0.103317C2.60567 0.103317 2.46343 0.376522 2.60261 0.575355L4.75409 3.6489C4.87352 3.81952 5.1262 3.81952 5.24563 3.6489Z"
										fill="currentColor"
									></path></svg
								></span
							></span
						>
					</div>
					<div class="orders_cell orders_type">
						<span class="ant-dropdown-trigger orders_statusDropdown"
							><span>Type</span><svg
								class="svg-icon"
								focusable="false"
								width="1em"
								height="1em"
								fill="currentColor"
								aria-hidden="true"
								viewBox="0 0 12 12"
								data-icon="DropArrow"
								style="font-size: 12px;"
								><path
									d="M9.31567 3.6001C9.82594 3.6001 10.1033 4.19661 9.77444 4.58678L6.71567 8.21579C6.47595 8.50021 6.03785 8.50021 5.79812 8.21579L2.73936 4.58678C2.4105 4.19661 2.68786 3.6001 3.19813 3.6001H9.31567Z"
									fill="currentColor"
								></path></svg
							></span
						>
					</div>
					<div class="orders_cell orders_side">Side</div>
					<div class="orders_cell orders_price">Price</div>
					<div class="orders_cell orders_quantity">Quantity</div>
					<div class="orders_cell orders_amount">Order Amount</div>
					<div class="orders_cell orders_filled">Filled</div>
					<div class="orders_cell orders_cancel">Cancell All</div>
				</div>
			</section>
		</section>
		<div class="table-content">
			{#each new Array(7) as i}
			<div class="table-row">
					<div class="orders_cell_data orders_symbol">rsBTC/sigUSD</div>
					<div class="orders_cell_data orders_date">
						20:32:12
					</div>
					<div class="orders_cell_data orders_type">
						Limit
					</div>
					<div class="orders_cell_data orders_side">Buy</div>
					<div class="orders_cell_data orders_price">65,000.00</div>
					<div class="orders_cell_data orders_quantity">0.3</div>
					<div class="orders_cell_data orders_amount">$37,500.00</div>
					<div class="orders_cell_data orders_filled">0%</div>
					<div class="orders_cell_data orders_cancel">cancel</div>
			</div>
			{/each}
		</div>
	</section>
</div>

<style lang="postcss">
	.table-content{
		padding-inline-start: 16px;
		padding-inline-end: 16px;
	}
	.table-row{
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.exchange_ordersWrapper {
		grid-column: 1/4;
		grid-row: 4/5;
		background-color: var(--bg-level-secondary);
		display: flex;
		flex-flow: column nowrap;
	}

	.orders_tableWrapper {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
	}
	.orders_header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--divider-primary);
		-webkit-padding-start: 6px;
		padding-inline-start: 6px;
		flex-shrink: 0;
	}

	.orders_headerLeft {
		flex-grow: 1;
		display: flex;
		align-items: center;
	}
	.orders_headerRight {
		display: flex;
		align-items: center;
		color: var(--primary-text);
		font-size: 12px;
		position: relative;
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
	.orders_headerLeftWrapper {
		display: flex;
		align-items: center;
	}
	.orders_tab {
		height: 40px;
		line-height: 40px;
		color: var(--text-secondary);
		margin: 0 10px;
		cursor: pointer;
		position: relative;
	}

	.orders_tab:before {
		position: absolute;
		content: ' ';
		width: 100%;
		height: 2px;
		border-radius: 2px;
		background-color: var(--primary-blue);
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		opacity: 0;
		transition: all 0.16s ease-in;
	}
	.orders_tab-active {
		color: var(--text-primary);
		font-weight: 500;
	}
	.orders_tab-active:before {
		opacity: 1;
		transform: translateX(-50%);
	}

	.orders_showCurrent {
		margin: 0 10px;
		display: flex;
	}
	.ant-checkbox-wrapper {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		color: var(--text-color);
		font-size: var(--font-size-base);
		font-variant: var(--font-variant-base);
		line-height: var(--line-height-base);
		list-style: none;
		font-feature-settings: var(--font-feature-settings-base);
		display: inline-flex;
		align-items: baseline;
		line-height: unset;
		cursor: pointer;
	}
	.ant-checkbox-input {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		cursor: pointer;
		opacity: 0;
	}
	.ant-checkbox-inner {
		position: relative;
		top: 0;
		left: 0;
		display: block;
		width: var(--checkbox-size);
		height: var(--checkbox-size);
		direction: ltr;
		background-color: initial;
		border: var(--checkbox-border-width) var(--border-style-base)
			var(--border-color-base);
		border-radius: var(--checkbox-border-radius);
		border-collapse: initial;
		transition: all 0.3s;
	}

	.orders_listBodyContent {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
	}
	.orders_tableHeader {
		height: 36px;
		padding-top: 14px;
		color: var(--text-secondary);
		align-items: start;
		padding-bottom: 2px;
		position: sticky;
		top: 0;
		z-index: 1;
		background-color: var(--bg-level-secondary);
		display: flex;
		font-size: 12px;
		padding-inline-start: 16px;
		padding-inline-end: 16px;
		border-bottom: 1px solid var(--divider);
		flex-shrink: 0;
	}

	.orders_cell {
		cursor: pointer;
		padding-inline-end: 4px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.orders_cell_data {
		padding-inline-end: 4px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.orders_symbol {
		width: 12%;
		display: flex;
		align-items: center;
	}

	.orders_date {
		width: 150px;
	}

	.sort-caret_sortWrapper {
		color: var(--text-secondary);
	}
	.sort-caret_sort {
		display: inline-block;
		vertical-align: middle;
	}

	.sort-caret_caret {
		display: block;
		font-size: 12px;
		height: 6px;
		color: var(--icon-secondary);
	}
	.svg-icon {
		display: none;
		width: 1em;
		vertical-align: -0.15em;
		fill: currentColor;
		overflow: hidden;
	}

	.sort-caret_active {
		color: var(--primary-base);
	}
	.orders_type {
		width: 10%;
	}
	.orders_statusDropdown {
		display: flex;
		align-items: center;
	}
	.orders_side {
		width: 10%;
		text-align: center;
	}
	.orders_price {
		flex: 1 1;
		text-align: right;
	}
	.orders_quantity {
		flex: 1 1;
		text-align: right;
	}

	.orders_amount {
		flex: 1 1;
		text-align: right;
	}
	.orders_filled {
		width: 8%;
		text-align: right;
	}
	.orders_cancel {
		width: 13%;
		text-align: right;
	}
</style>
