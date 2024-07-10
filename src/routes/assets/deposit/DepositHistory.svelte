<script>
	import { ergoTokens } from '$lib/constants/ergoTokens';
	import { tx_history } from '$lib/ui/ui_state';
</script>

<div class="exchange_ordersWrapper page_container" style="padding: 0;min-height: unset;">
	<section class="orders_tableWrapper">
		<div class="orders_header">
			<div class="orders_tab orders_tab-active">Deposits</div>
		</div>
		<section class="orders_listBodyContent">
			<table class="orders_table">
				<thead>
					<tr>
						<th>Tokens</th>
						<th>Time</th>
						<th>TxId</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each $tx_history as tx}
						<tr>
							<td
								>{Number(tx.value) / 10 ** 9} ERG
								{#each tx.tokens as token}
									, {token.amount} {ergoTokens[token.tokenId]?.ticker ?? '???'}
								{/each}
							</td>
							<td>{new Date(tx.timestamp).toLocaleString()}</td>
							<td>
								<a
									href="https://explorer.ergoplatform.com/en/transactions/{tx.txId}"
									>{tx.txId}</a
								>
							</td>
							{#if tx.phase == 'MEMPOOL'}
								<td
									><a href="https://explorer.ergoplatform.com/en/mempool"
										>mempool</a
									></td
								>
							{:else}
								<td>SUCCESS</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	</section>
</div>

<style lang="postcss">
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
	.orders_table {
		width: 100%;
		border-collapse: collapse;
	}
	thead {
		height: 36px;
		color: var(--text-secondary);
		position: sticky;
		top: 0;
		z-index: 1;
		background-color: var(--bg-level-secondary);
		font-size: 12px;
		padding-inline-start: 16px;
		padding-inline-end: 16px;
		border-bottom: 1px solid var(--divider);
		text-align: left;
	}
	.orders_table th,
	.orders_table td {
		padding-inline-end: 4px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.orders_table td {
		padding: 8px 16px;
	}
	.orders_table th {
		padding: 0px 16px;
		padding-top: 16px;
		padding-bottom: 2px;
	}
</style>
