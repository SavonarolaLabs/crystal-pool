<script lang="ts">
	import { orderbook_buy, orderbook_latest, orderbook_sell } from '$lib/ui/ui_state';

	// buy -> green -> sigUSD,rsBTC
	// sell -> red -> rsBTC,sigUSD
</script>

<div class="orderbook">
	<div>Order Book</div>
	<div class="orderbook_controller">
		<div class="orderbook_dirWrapper">
			<span class="orderbook_orderMode"
				><svg
					class="svg-icon orderbook_iconBuySell"
					focusable="false"
					width="1em"
					height="1em"
					fill="currentColor"
					aria-hidden="true"
					viewBox="0 0 20 20"
					data-icon="IconOrderbookUpgreen"
					><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M15.9947 5.46776C15.9947 5.88493 15.6565 6.22312 15.2393 6.22312L4.76122 6.22312C4.34404 6.22312 4.00586 5.88493 4.00586 5.46776C4.00586 5.05059 4.34404 4.7124 4.76122 4.7124L15.2393 4.7124C15.6565 4.7124 15.9947 5.05059 15.9947 5.46776Z"
						fill="#EE2C5A"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M15.9947 14.5322C15.9947 14.9494 15.6565 15.2876 15.2393 15.2876L4.76122 15.2876C4.34404 15.2876 4.00586 14.9494 4.00586 14.5322C4.00586 14.115 4.34404 13.7769 4.76122 13.7769L15.2393 13.7769C15.6565 13.7769 15.9947 14.115 15.9947 14.5322Z"
						fill="#16B979"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 8.48924C13.4256 8.90642 13.0874 9.2446 12.6703 9.2446L4.76122 9.2446C4.34404 9.2446 4.00586 8.90642 4.00586 8.48924C4.00586 8.07207 4.34404 7.73389 4.76122 7.73389L12.6703 7.73389C13.0874 7.73389 13.4256 8.07207 13.4256 8.48924Z"
						fill="#EE2C5A"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 11.5107C13.4256 11.9279 13.0874 12.2661 12.6703 12.2661L4.76122 12.2661C4.34404 12.2661 4.00586 11.9279 4.00586 11.5107C4.00586 11.0936 4.34404 10.7554 4.76122 10.7554L12.6703 10.7554C13.0874 10.7554 13.4256 11.0936 13.4256 11.5107Z"
						fill="#16B979"
					></path></svg
				></span
			><span class="orderbook_orderMode"
				><svg
					class="svg-icon orderbook_iconBuySell"
					focusable="false"
					width="1em"
					height="1em"
					fill="currentColor"
					aria-hidden="true"
					viewBox="0 0 20 20"
					data-icon="IconOrderbookBuy"
					><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M15.9947 14.5322C15.9947 14.1151 15.6565 13.7769 15.2393 13.7769L4.76122 13.7769C4.34404 13.7769 4.00586 14.1151 4.00586 14.5322C4.00586 14.9494 4.34404 15.2876 4.76122 15.2876L15.2393 15.2876C15.6565 15.2876 15.9947 14.9494 15.9947 14.5322Z"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 11.5108C13.4256 11.0936 13.0874 10.7554 12.6703 10.7554L4.76122 10.7554C4.34404 10.7554 4.00586 11.0936 4.00586 11.5108C4.00586 11.9279 4.34404 12.2661 4.76122 12.2661L12.6703 12.2661C13.0874 12.2661 13.4256 11.9279 13.4256 11.5108Z"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 8.48927C13.4256 8.0721 13.0874 7.73391 12.6703 7.73391L4.76122 7.73391C4.34404 7.73391 4.00586 8.0721 4.00586 8.48927C4.00586 8.90644 4.34404 9.24463 4.76122 9.24463L12.6703 9.24463C13.0874 9.24463 13.4256 8.90644 13.4256 8.48927Z"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 5.46779C13.4256 5.05062 13.0874 4.71243 12.6703 4.71243L4.76122 4.71243C4.34404 4.71243 4.00586 5.05062 4.00586 5.46779C4.00586 5.88496 4.34404 6.22314 4.76122 6.22314L12.6703 6.22314C13.0874 6.22314 13.4256 5.88496 13.4256 5.46779Z"
					></path></svg
				></span
			><span class="orderbook_orderMode"
				><svg
					class="svg-icon orderbook_iconBuySell"
					focusable="false"
					width="1em"
					height="1em"
					fill="currentColor"
					aria-hidden="true"
					viewBox="0 0 20 20"
					data-icon="IconOrderbookSell"
					><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M15.9947 5.4677C15.9947 5.88487 15.6565 6.22306 15.2393 6.22306L4.76122 6.22306C4.34404 6.22306 4.00586 5.88487 4.00586 5.4677C4.00586 5.05053 4.34404 4.71234 4.76122 4.71234L15.2393 4.71234C15.6565 4.71234 15.9947 5.05053 15.9947 5.4677Z"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 8.48918C13.4256 8.90635 13.0874 9.24454 12.6703 9.24454L4.76122 9.24454C4.34404 9.24454 4.00586 8.90635 4.00586 8.48918C4.00586 8.07201 4.34404 7.73383 4.76122 7.73383L12.6703 7.73383C13.0874 7.73383 13.4256 8.07201 13.4256 8.48918Z"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 11.5107C13.4256 11.9278 13.0874 12.266 12.6703 12.266L4.76122 12.266C4.34404 12.266 4.00586 11.9278 4.00586 11.5107C4.00586 11.0935 4.34404 10.7553 4.76122 10.7553L12.6703 10.7553C13.0874 10.7553 13.4256 11.0935 13.4256 11.5107Z"
					></path><path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M13.4256 14.5323C13.4256 14.9494 13.0874 15.2876 12.6703 15.2876L4.76122 15.2876C4.34404 15.2876 4.00586 14.9494 4.00586 14.5323C4.00586 14.1151 4.34404 13.7769 4.76122 13.7769L12.6703 13.7769C13.0874 13.7769 13.4256 14.1151 13.4256 14.5323Z"
					></path></svg
				></span
			>
		</div>
		<div class="orderbook_dirWrapper">
			<div class="ant-dropdown-trigger orderbook_drop">
				<span>0.01</span><svg
					class="sc-eqUAAy cMqsAc mx-icon orderbook_dropIcon"
					focusable="false"
					width="1em"
					height="1em"
					fill="currentColor"
					aria-hidden="true"
					viewBox="0 0 12 12"
					data-icon="DropArrow"
					style="color: var(--text-secondary); font-size: 12px;"
					><path
						d="M9.31567 3.6001C9.82594 3.6001 10.1033 4.19661 9.77444 4.58678L6.71567 8.21579C6.47595 8.50021 6.03785 8.50021 5.79812 8.21579L2.73936 4.58678C2.4105 4.19661 2.68786 3.6001 3.19813 3.6001H9.31567Z"
						fill="currentColor"
					></path></svg
				>
			</div>
		</div>
	</div>
	<div class="orderbook_tableHeader">
		<h2 class="orderbook_column orderbook_price">Price(sigUSD)</h2>
		<h2 class="orderbook_column orderbook_vol">Amount(rsBTC)</h2>
		<h2 class="orderbook_column orderbook_amount">Total (sigUSD)</h2>
	</div>
	<div class="orderbook_body">
		<div class="orderbook_asks">
			{#each $orderbook_sell as row}
				<div class="orderbook_row">
					<div
						class="orderbook_bar orderbook_askBar"
						style="transform: scaleX(0.2249933);"
					></div>
					<div class="orderbook_price orderbook_sell">
						{row.price.toFixed(2)}
					</div>
					<div class="orderbook_vol"><span>{row.amount.toFixed(6)}</span></div>
					<div class="orderbook_amount"><span>{row.value.toFixed(2)}</span></div>
				</div>
			{/each}
		</div>
		<div class="flex items-center">
			<span
				class="orderbook_bigPrice"
				class:orderbook_sell={$orderbook_latest.side == 'sell'}
				class:orderbook_buy={$orderbook_latest.side == 'buy'}
				><span>{$orderbook_latest.price}</span><svg
					class="orderbook_updownArrow"
					focusable="false"
					width="1em"
					height="1em"
					fill="currentColor"
					aria-hidden="true"
					viewBox="0 0 1024 1024"
					data-icon="ArrowRightOutlined"
					><path
						d="M128 469.333333h604.586667l-152.746667-153.173333L640 256l256 256-256 256-60.16-60.16L732.586667 554.666667H128z"
					></path></svg
				></span
			><span class="orderbook_fiatPrice ml-2"
				><span style="margin-inline-end: 4px;">≈</span><span dir="ltr"
					><span style="margin-inline-end: 2px;">$</span><span dir="ltr"
						>{$orderbook_latest.value}</span
					></span
				></span
			>
		</div>
		<div class="orderbook_bids">
			{#each $orderbook_buy as row}
				<div class="orderbook_row">
					<div
						class="orderbook_bar orderbook_bidBar"
						style="transform: scaleX(0.2249933);"
					></div>
					<div class="orderbook_price orderbook_buy">{row.price.toFixed(2)}</div>
					<div class="orderbook_vol"><span>{row.amount.toFixed(6)}</span></div>
					<div class="orderbook_amount"><span>{row.value.toFixed(2)}</span></div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="postcss">
	.orderbook {
		margin: 4px 0;
		margin-inline-start: 10px;
		heigh: 32px;
		line-height: 32px;
		padding-inline-start: 6px;
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.orderbook_controller {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 24px;
		margin-top: 2px;
		padding-inline-end: 10px;
	}
	.orderbook_dirWrapper {
		display: flex;
	}
	.orderbook_drop {
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
	.orderbook_tableHeader {
		display: flex;
		align-items: center;
		height: 30px;
		position: relative;
		overflow: hidden;
		padding: 6px 0 2px;
		padding-inline-end: 10px;
	}
	.orderbook_column {
		color: var(--text-secondary);
		white-space: nowrap;
		margin-bottom: 0;
		font-size: 12px;
		font-weight: 400;
	}
	.orderbook_price {
		width: 37%;
	}
	.orderbook_vol {
		width: 33%;
		text-align: end;
		-webkit-padding-start: 4px;
		padding-inline-start: 4px;
	}
	.orderbook_amount {
		width: 30%;
		text-align: end;
		position: relative;
		cursor: pointer;
	}

	.orderbook_body {
		flex-grow: 1;
	}

	.orderbook_asks {
		display: flex;
		flex-direction: column-reverse;
	}

	.orderbook_asks,
	.orderbook_bids {
		overflow-x: hidden;
		overflow-y: hidden;
		height: calc((100% - 36px) / 2);
		width: 100%;
		font-size: 12px;
	}
	.orderbook_row {
		display: flex;
		height: 20px;
		line-height: 20px;
		overflow: hidden;
		position: relative;
		padding-inline-end: 10px;
	}

	.orderbook_sell {
		color: var(--down);
	}
	.orderbook_buy {
		color: var(--up);
	}

	.orderbook_bar {
		width: 100%;
		transform-origin: right;
		height: 20px;
		position: absolute;
		right: 0;
		top: 0;
		opacity: 0.1;
	}
	.orderbook_askBar {
		background-color: var(--down);
	}
	.orderbook_bidBar {
		background-color: var(--up);
	}

	.orderbook_newPrice {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.orderbook_bigPrice {
		font-size: 16px;
		font-weight: 700;
		display: flex;
		align-items: center;
	}
	.orderbook_sell .orderbook_updownArrow {
		transform: rotate(90deg);
		opacity: 1;
	}
	.orderbook_buy .orderbook_updownArrow {
		transform: rotate(270deg);
		opacity: 1;
	}
	.orderbook_fiatPrice {
		font-size: 12px;
		color: var(--primary-text);
		-webkit-margin-start: 5px;
		margin-inline-start: 5px;
	}
	.svg-icon {
		font-size: 18px;
	}
</style>
