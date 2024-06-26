<script lang="ts">
	import { BOB_ADDRESS } from '$lib/constants/addresses';
	import { BOB_MNEMONIC } from '$lib/constants/mnemonics';
	import { TOKEN } from '$lib/constants/tokens';
	import { b, signTxInput } from '$lib/wallet/multisig-client';
	import { configureSwapTx, createSwapTx, signSwapTx } from '$lib/ui/service/crystalPoolService';
	import BigNumber from 'bignumber.js';
	import { user_address, user_mnemonic, user_tokens } from '../ui_state';
	import {
		createAndMultisigSwapTx,
		executeAndSignInputsSwapTx,
		type SwapRequest
	} from '../service/tradingService';

	let buyPriceInput = '69000';
	let buyAmountInput = '0.1';
	let buyTotalInput = (parseFloat(buyPriceInput) * parseFloat(buyAmountInput))
		.toFixed(8)
		.replace(/\.?0+$/, '');

	let sellPriceInput = '69000';
	let sellAmountInput = '0.1';
	let sellTotalInput = (parseFloat(sellPriceInput) * parseFloat(sellAmountInput))
		.toFixed(8)
		.replace(/\.?0+$/, '');

	function handleBuyPriceChange(event) {
		buyPriceInput = event.target.value;
		calcBuyTotal();
	}

	function handleBuyAmountChange(event) {
		buyAmountInput = event.target.value;
		calcBuyTotal();
	}

	function handleBuyTotalChange(event) {
		buyTotalInput = event.target.value;
		calcBuyAmount();
	}

	function handleSellPriceChange(event) {
		sellPriceInput = event.target.value;
		calcSellTotal();
	}

	function handleSellAmountChange(event) {
		sellAmountInput = event.target.value;
		calcSellTotal();
	}

	function handleSellTotalChange(event) {
		sellTotalInput = event.target.value;
		calcSellAmount();
	}

	function calcBuyTotal() {
		const price = parseFloat(buyPriceInput);
		const amount = parseFloat(buyAmountInput);
		if (!isNaN(price) && !isNaN(amount)) {
			buyTotalInput = (price * amount).toFixed(8).replace(/\.?0+$/, '');
		}
	}

	function calcBuyAmount() {
		const total = parseFloat(buyTotalInput);
		const price = parseFloat(buyPriceInput);
		if (!isNaN(price) && !isNaN(total)) {
			buyAmountInput = (total / price).toFixed(8).replace(/\.?0+$/, '');
		}
	}

	function calcSellTotal() {
		const price = parseFloat(sellPriceInput);
		const amount = parseFloat(sellAmountInput);
		if (!isNaN(price) && !isNaN(amount)) {
			sellTotalInput = (price * amount).toFixed(8).replace(/\.?0+$/, '');
		}
	}

	function calcSellAmount() {
		const total = parseFloat(sellTotalInput);
		const price = parseFloat(sellPriceInput);
		if (!isNaN(price) && !isNaN(total)) {
			sellAmountInput = (total / price).toFixed(8).replace(/\.?0+$/, '');
		}
	}

	function bigIntReplacer(value: any): string {
		return typeof value === 'bigint' ? value.toString() : value;
	}

	function dummySwapParams() {
		const address = BOB_ADDRESS;

		const price = 100n;
		const amount = 200n;
		const sellingTokenId = TOKEN.sigUSD.tokenId;
		const buyingTokenId = TOKEN.rsBTC.tokenId;

		const swapParams: SwapRequest = {
			address: address,
			price: bigIntReplacer(price),
			amount: bigIntReplacer(amount),
			sellingTokenId: sellingTokenId,
			buyingTokenId: buyingTokenId,
			side: 'sell'
		};

		return swapParams;
	}
	async function swapExecuteBuy() {
		const sellingToken = TOKEN.rsBTC;
		const buyingToken = TOKEN.sigUSD;

		// take user inputs
		const amountInput = new BigNumber(buyAmountInput);
		const priceInput = new BigNumber(buyPriceInput);

		// load and calculate decimals
		const decimalsToken = TOKEN.rsBTC.decimals;
		const decimalsCurrency = TOKEN.sigUSD.decimals;
		const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
		const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);
		const bigDecimalsDelta = bigDecimalsToken.dividedBy(bigDecimalsCurrency);

		// apply decimals
		const real_price = priceInput.dividedBy(bigDecimalsDelta);
		const real_amount = amountInput.multipliedBy(bigDecimalsToken);
		const total = real_price.multipliedBy(real_amount);

		console.log('real price: 1 sat in cents =', real_price.toString());
		console.log('real amount: sats =', real_amount.toString());
		console.log('total amount: cents =', total.toString());

		const swapParams: SwapRequest = {
			address: $user_address,
			price: real_price.toString(),
			amount: real_amount.toString(),
			sellingTokenId: sellingToken.tokenId,
			buyingTokenId: buyingToken.tokenId,
			side: 'sell'
		};
		console.log('swap params for selling:', swapParams);
		//----------------------------
		let signedTx = await executeAndSignInputsSwapTx(swapParams, signTxInput); // UNSIGNED TX
		console.log(signedTx);
	}

	async function swapActionBuy() {
		//const swapParams = dummySwapParams();

		const sellingToken = TOKEN.sigUSD;
		const buyingToken = TOKEN.rsBTC;

		// take user inputs
		const amountInput = new BigNumber(buyAmountInput);
		const priceInput = new BigNumber(buyPriceInput);

		// load and calculate decimals
		const decimalsToken = TOKEN.rsBTC.decimals;
		const decimalsCurrency = TOKEN.sigUSD.decimals;
		const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
		const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);
		const bigDecimalsDelta = bigDecimalsToken.dividedBy(bigDecimalsCurrency);

		// apply decimals to contract
		const real_price = BigNumber(1)
			.dividedBy(priceInput.dividedBy(bigDecimalsDelta))
			.toString(10); // 1 sats =
		const real_amount = amountInput
			.multipliedBy(priceInput)
			.multipliedBy(bigDecimalsCurrency)
			.toString(10);
		const total = amountInput.multipliedBy(bigDecimalsToken).toString(10);
		console.log('real_price 1 cent in sats = ', real_price);
		console.log('real_amount in cents', real_amount);
		console.log('total in sats', total);

		//real_price.multipliedBy(real_amount);
		const swapParams: SwapRequest = {
			address: $user_address,
			price: real_price.toString(),
			amount: real_amount.toString(),
			sellingTokenId: sellingToken.tokenId,
			buyingTokenId: buyingToken.tokenId,
			side: 'buy'
		};
		//

		console.log('swap params for selling:', swapParams);
		//----------------------------
		let signedTx = await createAndMultisigSwapTx(swapParams, b, $user_mnemonic, $user_address);
		console.log(signedTx);
		return;
	}

	async function swapActionSell() {
		const sellingToken = TOKEN.rsBTC;
		const buyingToken = TOKEN.sigUSD;

		// take user inputs
		const amountInput = new BigNumber(sellAmountInput);
		const priceInput = new BigNumber(sellPriceInput);

		// load and calculate decimals
		const decimalsToken = TOKEN.rsBTC.decimals;
		const decimalsCurrency = TOKEN.sigUSD.decimals;
		const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
		const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);
		const bigDecimalsDelta = bigDecimalsToken.dividedBy(bigDecimalsCurrency);

		// apply decimals
		const real_price = priceInput.dividedBy(bigDecimalsDelta);
		const real_amount = amountInput.multipliedBy(bigDecimalsToken);
		const total = real_price.multipliedBy(real_amount);

		console.log('real price: 1 sat in cents =', real_price.toString());
		console.log('real amount: sats =', real_amount.toString());
		console.log('total amount: cents =', total.toString());

		//SwapRequest
		// BOB HAS 0.01 rsBTC
		// TEST ORDER DISTRIBUTION
		// 0.001 rsBTC  -  PRICE: 10  -  TOTAL: 1  cent
		// 0.002 rsBTC  -  PRICE: 20  -  TOTAL: 4  cent
		// 0.003 rsBTC  -  PRICE  30  -  TOTAL: 9  cent
		// 0.004 rsBTC  -  PRICE  40  -  TOTAL: 16 cent

		const swapParams: SwapRequest = {
			address: $user_address,
			price: real_price.toString(),
			amount: real_amount.toString(),
			sellingTokenId: sellingToken.tokenId,
			buyingTokenId: buyingToken.tokenId,
			side: 'sell'
		};
		console.log('swap params for selling:', swapParams);
		//----------------------------
		let signedTx = await createAndMultisigSwapTx(swapParams, b, $user_mnemonic, $user_address);
		console.log(signedTx);
	}

	async function configureBuy() {
		//configure 1-st pack of params for Sell Check
		const sellingToken = TOKEN.rsBTC;
		const buyingToken = TOKEN.sigUSD;

		// take user inputs
		const amountInput = new BigNumber(buyAmountInput);
		const priceInput = new BigNumber(buyPriceInput);

		// load and calculate decimals
		const decimalsToken = TOKEN.rsBTC.decimals;
		const decimalsCurrency = TOKEN.sigUSD.decimals;
		const bigDecimalsToken = BigNumber(10).pow(decimalsToken);
		const bigDecimalsCurrency = BigNumber(10).pow(decimalsCurrency);
		const bigDecimalsDelta = bigDecimalsToken.dividedBy(bigDecimalsCurrency);

		// apply decimals
		const real_price = priceInput.dividedBy(bigDecimalsDelta);
		const real_amount = amountInput.multipliedBy(bigDecimalsToken);
		const total = real_price.multipliedBy(real_amount);

		console.log('real price: 1 sat in cents =', real_price.toString());
		console.log('real amount: sats =', real_amount.toString());
		console.log('total amount: cents =', total.toString());

		const swapParams: SwapRequest = {
			address: $user_address,
			price: real_price.toString(),
			amount: real_amount.toString(),
			sellingTokenId: sellingToken.tokenId,
			buyingTokenId: buyingToken.tokenId,
			side: 'sell'
		};
		console.log('swap params for configuring buy action:', swapParams);

		//Request Server
		let swapParamsExecute = await configureSwapTx(swapParams); // new SwapParams
		console.log(swapParamsExecute);

		//EXECUTE IT
		let signedTx = await executeAndSignInputsSwapTx(swapParamsExecute, signTxInput); // UNSIGNED TX
		console.log(signedTx);
		//configure 2-nd pack for Buy Execution
	}
</script>

<div class="actions">
	<div class="actions_header">
		<div class="actions_headerTabActive">Spot</div>
		<div class="fee">
			Maker <span style="display: inline-block; direction: ltr;">0.000%</span>
			/ Taker
			<span style="display: inline-block; direction: ltr;">0.000%</span>
		</div>
	</div>
	<div class="actions_contentWrapper">
		<div
			class="actions_line actions_mode__nRnKJ actions_textNowarp__3QcjB actions_modeActive__VpeUM"
		>
			Limit
		</div>

		<!-- START -->

		<div class="actions_buySellWrapper">
			<div class="actions_buyWrapper actions_doWrapper">
				<div class="actions_balance">
					<div>
						<span class="actions_primaryText" style="margin-inline-end: 8px;"
							>Available
						</span><span
							><span>
								{($user_tokens.find((t) => t.name == 'sigUSD')?.amount ?? 0) /
									10 **
										($user_tokens.find((t) => t.name == 'sigUSD')?.decimals ??
											2)}
							</span><span> sigUSD</span></span
						>
					</div>
					<a href="/assets/deposit/sigUSD" class="actions_deposit"
						><svg
							class="sc-eqUAAy cMqsAc mx-icon"
							focusable="false"
							width="1em"
							height="1em"
							fill="currentColor"
							aria-hidden="true"
							viewBox="0 0 1024 1024"
							data-icon="PlusCircleFilled"
							style="font-size: 16px;"
							><path
								d="M907.636364 523.636364a384 384 0 1 0-768 0 384 384 0 0 0 768 0z m-418.909091-139.636364a34.909091 34.909091 0 0 1 69.818182 0v104.727273h104.727272a34.909091 34.909091 0 0 1 0 69.818182H558.545455v104.727272a34.909091 34.909091 0 0 1-69.818182 0V558.545455H384a34.909091 34.909091 0 0 1 0-69.818182h104.727273V384z"
							></path></svg
						></a
					>
				</div>
				<div class="actions_inputWrapper__OKcnB actions_line">
					<div class="plus-minus_wrapper__ht_aW">
						<span
							class="ant-input-affix-wrapper input-plus-minus ant-input-affix-wrapper-sm"
							><span class="ant-input-prefix"
								><span class="plus-minus_prefix__IJXO_">Price</span></span
							><input
								placeholder=""
								data-testid="spot-trade-buyPrice"
								class="ant-input ant-input-sm"
								type="text"
								on:input={handleBuyPriceChange}
								bind:value={buyPriceInput}
							/><span class="ant-input-suffix"><span>sigUSD</span> </span></span
						>
					</div>
				</div>
				<div class="actions_inputWrapper__OKcnB actions_line">
					<div class="plus-minus_wrapper__ht_aW">
						<span
							class="ant-input-affix-wrapper input-plus-minus ant-input-affix-wrapper-sm"
							><span class="ant-input-prefix"
								><span class="plus-minus_prefix__IJXO_">Amount</span></span
							><input
								placeholder=""
								data-testid="spot-trade-buyQuantity"
								class="ant-input ant-input-sm"
								type="text"
								on:input={handleBuyAmountChange}
								bind:value={buyAmountInput}
							/><span class="ant-input-suffix"><span>rsBTC</span> </span></span
						>
					</div>
				</div>
				<div class="actions_slide__pKkpF actions_line">
					<div
						class="ant-slider slider-buy ant-slider-disabled ant-slider-horizontal ant-slider-with-marks"
					>
						<div class="ant-slider-rail"></div>
						<div class="ant-slider-track" style="left: 0%; width: 0%;"></div>
						<div class="ant-slider-step">
							<span
								class="ant-slider-dot ant-slider-dot-active"
								style="left: 0%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 25%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 50%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 75%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 100%; transform: translateX(-50%);"
							></span>
						</div>
						<div
							class="ant-slider-handle"
							role="slider"
							aria-valuemin="0"
							aria-valuemax="100"
							aria-valuenow="0"
							aria-disabled="true"
							style="left: 0%; transform: translateX(-50%);"
						></div>
						<div class="ant-slider-mark">
							<span
								class="ant-slider-mark-text ant-slider-mark-text-active"
								style="left: 0%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 25%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 50%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 75%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 100%; transform: translateX(-50%);"
							>
							</span>
						</div>
					</div>
				</div>
				<div class="actions_inputWrapper__OKcnB actions_line">
					<div class="plus-minus_wrapper__ht_aW">
						<span
							class="ant-input-affix-wrapper input-plus-minus ant-input-affix-wrapper-sm"
							><span class="ant-input-prefix"
								><span class="plus-minus_prefix__IJXO_">Total</span></span
							><input
								placeholder=""
								data-testid="spot-trade-buyTotal"
								class="ant-input ant-input-sm"
								type="text"
								on:input={handleBuyTotalChange}
								bind:value={buyTotalInput}
							/><span class="ant-input-suffix"><span>sigUSD</span> </span></span
						>
					</div>
				</div>

				<button class="buySellButton buyButton" on:click={configureBuy}>Buy</button>
			</div>
			<div class="actions_doWrapper">
				<div class="actions_balance">
					<div>
						<span class="actions_primaryText" style="margin-inline-end: 8px;"
							>Available
						</span><span
							><span>
								{($user_tokens.find((t) => t.name == 'rsBTC')?.amount ?? 0) /
									10 **
										($user_tokens.find((t) => t.name == 'rsBTC')?.decimals ??
											9)}
							</span><span> rsBTC</span></span
						>
					</div>
					<a href="/assets/deposit/rsBTC" class="actions_deposit"
						><svg
							class="sc-eqUAAy cMqsAc mx-icon"
							focusable="false"
							width="1em"
							height="1em"
							fill="currentColor"
							aria-hidden="true"
							viewBox="0 0 1024 1024"
							data-icon="PlusCircleFilled"
							style="font-size: 16px;"
							><path
								d="M907.636364 523.636364a384 384 0 1 0-768 0 384 384 0 0 0 768 0z m-418.909091-139.636364a34.909091 34.909091 0 0 1 69.818182 0v104.727273h104.727272a34.909091 34.909091 0 0 1 0 69.818182H558.545455v104.727272a34.909091 34.909091 0 0 1-69.818182 0V558.545455H384a34.909091 34.909091 0 0 1 0-69.818182h104.727273V384z"
							></path></svg
						></a
					>
				</div>
				<div class="actions_inputWrapper__OKcnB actions_line">
					<div class="plus-minus_wrapper__ht_aW">
						<span
							class="ant-input-affix-wrapper input-plus-minus ant-input-affix-wrapper-sm"
							><span class="ant-input-prefix"
								><span class="plus-minus_prefix__IJXO_">Price</span></span
							><input
								placeholder=""
								data-testid="spot-trade-sellPrice"
								class="ant-input ant-input-sm"
								type="text"
								on:input={handleSellPriceChange}
								bind:value={sellPriceInput}
							/><span class="ant-input-suffix"><span>sigUSD</span> </span></span
						>
					</div>
				</div>
				<div class="actions_inputWrapper__OKcnB actions_line">
					<div class="plus-minus_wrapper__ht_aW">
						<span
							class="ant-input-affix-wrapper input-plus-minus ant-input-affix-wrapper-sm"
							><span class="ant-input-prefix"
								><span class="plus-minus_prefix__IJXO_">Amount</span></span
							><input
								placeholder=""
								data-testid="spot-trade-sellQuantity"
								class="ant-input ant-input-sm"
								type="text"
								on:input={handleSellAmountChange}
								bind:value={sellAmountInput}
							/><span class="ant-input-suffix"><span>rsBTC</span> </span></span
						>
					</div>
				</div>
				<div class="actions_slide__pKkpF actions_line">
					<div
						class="ant-slider slider-sell ant-slider-disabled ant-slider-horizontal ant-slider-with-marks"
					>
						<div class="ant-slider-rail"></div>
						<div class="ant-slider-track" style="left: 0%; width: 0%;"></div>
						<div class="ant-slider-step">
							<span
								class="ant-slider-dot ant-slider-dot-active"
								style="left: 0%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 25%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 50%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 75%; transform: translateX(-50%);"
							></span><span
								class="ant-slider-dot"
								style="left: 100%; transform: translateX(-50%);"
							></span>
						</div>
						<div
							class="ant-slider-handle"
							role="slider"
							aria-valuemin="0"
							aria-valuemax="100"
							aria-valuenow="0"
							aria-disabled="true"
							style="left: 0%; transform: translateX(-50%);"
						></div>
						<div class="ant-slider-mark">
							<span
								class="ant-slider-mark-text ant-slider-mark-text-active"
								style="left: 0%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 25%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 50%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 75%; transform: translateX(-50%);"
							>
							</span><span
								class="ant-slider-mark-text"
								style="left: 100%; transform: translateX(-50%);"
							>
							</span>
						</div>
					</div>
				</div>
				<div class="actions_inputWrapper__OKcnB actions_line">
					<div class="plus-minus_wrapper__ht_aW">
						<span
							class="ant-input-affix-wrapper input-plus-minus ant-input-affix-wrapper-sm"
							><span class="ant-input-prefix"
								><span class="plus-minus_prefix__IJXO_">Total</span></span
							><input
								placeholder=""
								data-testid="spot-trade-sellTotal"
								class="ant-input ant-input-sm"
								type="text"
								on:input={handleSellTotalChange}
								bind:value={sellTotalInput}
							/><span class="ant-input-suffix"><span>sigUSD</span> </span></span
						>
					</div>
				</div>
				<button class="buySellButton sellButton" on:click={swapActionSell}>Sell</button>
			</div>
		</div>

		<!-- END -->
	</div>
</div>

<style lang="postcss">
	.actions {
		background-color: var(--bg-level-secondary);
	}
	.actions_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--divider-primary);
		padding: 0 16px;
		flex-shrink: 0;
		line-height: 40px;
	}
	.actions_headerTabActive {
		font-weight: 500;
	}
	.fee {
		color: var(--tint-blue-base);
		background-color: var(--tint-blue-smooth);
		font-size: 12px;
		border-radius: 2px;
		padding: 0 6px;
		line-height: 20px;
	}
	.actions_contentWrapper {
		padding: 5px 16px 13px;
	}
	.actions_line {
		margin-bottom: 10px;
		margin-top: 5px;
	}
	.actions_buySellWrapper {
		display: flex;
		justify-content: space-between;
		align-items: stretch;
		position: relative;
	}
	.actions_balance {
		margin-bottom: 5px;
		min-height: 28px;
		font-size: 12px;
		display: flex;
		align-items: center;
	}
	.actions_primaryText {
		color: var(--primary-text);
	}
	.actions_deposit {
		-webkit-padding-start: 4px;
		padding-inline-start: 4px;
		color: var(--primary-base);
	}

	.actions_buyWrapper {
		-webkit-padding-end: 12px;
		padding-inline-end: 12px;
	}
	.actions_doWrapper {
		flex-grow: 1;
		width: 50%;
	}
	.buySellButton {
		height: 36px;
		width: 100%;
		border: none;
		color: #fff;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.16s ease-in;
	}
	.buyButton {
		background-color: var(--up);
	}
	.sellButton {
		background-color: var(--down);
	}
</style>
