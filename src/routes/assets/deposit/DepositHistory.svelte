<div class="w-full exchange_ordersWrapper">
	<section class="orders_tableWrapper">
		<div class="orders_header">
			<div class="orders_tab orders_tab-active">Deposits</div>
			<div class="orders_headerRight"></div>
		</div>
		<section class="orders_listBodyContent">
			<div class="orders_tableHeader">
				<div class="orders_cell orders_symbol">Tokens</div>
				<div class="orders_cell orders_date">
					Time
				</div>
				<div class="orders_cell orders_filled">Transaction</div>
				<div class="orders_cell orders_cancel">Status</div>
			</div>
		</section>

		<div class="table-content">
			{#each new Array(7) as i}
				<div class="table-row">
					<div class="orders_cell_data ">12 ERG, 3000 Commet</div>
					<div class="orders_cell_data ">20:32:12</div>
					<div class="orders_cell_data ">0%</div>
					<div class="orders_cell_data ">mempool</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<style lang="postcss">
	.table-content {
		padding-inline-start: 16px;
		padding-inline-end: 16px;
	}
	.table-row {
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

	.orders_listBodyContent {
		display: flex;
		flex-flow: column nowrap;
		height: 100%;
	}
	.orders_tableHeader {
		height: 36px;
		padding-top: 14px;
		color: var(--text-secondary);
		padding-bottom: 2px;
		position: sticky;
		top: 0;
		z-index: 1;
		background-color: var(--bg-level-secondary);
		font-size: 12px;
		padding-inline-start: 16px;
		padding-inline-end: 16px;
		border-bottom: 1px solid var(--divider);
		flex-shrink: 0;
		display: flex;
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
