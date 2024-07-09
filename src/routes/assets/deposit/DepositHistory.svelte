<div class="w-full exchange_ordersWrapper">
	<section class="orders_tableWrapper">
		<div class="orders_header">
			<div class="orders_tab orders_tab-active">Deposits</div>
		</div>
		<section class="orders_listBodyContent">
			<div class="orders_tableHeader">
				<div class="orders_cell ">Tokens</div>
				<div class="orders_cell ">
					Time
				</div>
				<div class="orders_cell ">Transaction</div>
				<div class="orders_cell ">Status</div>
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

</style>
