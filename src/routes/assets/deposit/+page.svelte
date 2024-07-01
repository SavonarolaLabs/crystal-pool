<script>
	import { goto } from '$app/navigation';
	import { ergoTokens } from '$lib/constants/ergoTokens';
	import SelectCrypto from '$lib/ui/assets/SelectCrypto.svelte';
	import { kMaxLength } from 'buffer';
	import DepositProxyQR from './DepositProxyQR.svelte';

	let tokenId = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';
	let tokenAmount = '';
	let address = '9ffXZz5AovJvapPo63TGwdNaRPMUiHo2UkqGavmDGzrUERY9qJ3';
	let selectedTokens = [];

	let selectCryptoDialogOpen = false;
	function selectCrypto() {
		selectCryptoDialogOpen = true;
	}
	function handleMessage(event) {
		tokenId = event.detail.coin;
	}

	function clickAdd() {
		if (tokenAmount == '') {
			return;
		}
		const newToken = { tokenId: tokenId, amount: tokenAmount };
		selectedTokens = [...selectedTokens.filter((t) => t.tokenId != tokenId), newToken];
		tokenAmount = '';
	}

	function removeFromDeposit(tokenId){
		selectedTokens = selectedTokens.filter((t) => t.tokenId != tokenId)
	}

	//let selectedWallet = 'mobile';
	let selectedWallet = 'web3wallet';
</script>

<SelectCrypto bind:showDialog={selectCryptoDialogOpen} on:message={handleMessage}></SelectCrypto>
<div class="flex flex-col items-center">
	<div class="page-header flex items-center">
		<button class="back-arrow" on:click={() => goto('/assets')}>&#8592;</button>
		<div class="title">Deposit</div>
	</div>
	<div class="deposit_container">
		<div>
			<div class="deposit_dot">Select Wallet</div>
			<div class="tabs select-token_wrapper">
				<input
					type="radio"
					id="mobile"
					name="fav_language_one"
					value="mobile"
					bind:group={selectedWallet}
				/>
				<label for="mobile">Mobile</label>
				<input
					type="radio"
					id="web3wallet"
					name="fav_language_two"
					value="web3wallet"
					bind:group={selectedWallet}
				/>
				<label for="web3wallet">Web3 Wallet</label>
			</div>
		</div>
		{#if selectedWallet == 'mobile'}
			<div class="flex justify-center items-center">
				<div class="">
					<div class="deposit_dot text-center">Deposit Contract Address</div>
					<DepositProxyQR {address}></DepositProxyQR>
					<div class="mt-6"></div>
					<input class="ant-input ant-input-lg" style="width:300px;" value={address} />
				</div>
			</div>
		{:else}
			<div class="flex gap-10">
				<div class="flex flex-col justify-betweenbg-red-200 grow">
					<div class="h-full flex flex-col justify-between">
						<div>
							<div class="deposit_dot">Select Crypto</div>
							<div class="select-token_wrapper">
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div class="select-token_selectMode" on:click={selectCrypto}>
									<div class="flex items-center gap-2">
										<img
											style="width:32px;"
											alt=""
											src={ergoTokens[tokenId].logoURI
												? ergoTokens[tokenId].logoURI
												: `/token/${tokenId}.svg`}
										/><span class="select-token_currency"
											>{ergoTokens[tokenId].ticker}</span
										><span class="label">{ergoTokens[tokenId].name}</span>
									</div>
									<svg
										class="-mr-1 h-5 w-5 text-gray-400"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path
											fill-rule="evenodd"
											d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							</div>

							<div class="deposit_dot">Enter Amount</div>
							<div class="select-token_wrapper">
								<input
									class="w-full ant-input ant-input-lg"
									bind:value={tokenAmount}
								/>
							</div>
						</div>

						<div class="select-token_wrapper">
							<button class="btn" on:click={clickAdd}>Add</button>
						</div>
					</div>
				</div>
				<div class="grow flex flex-col">
					<div class="deposit_dot">Selected for Deposit</div>

					<div
						class="scroll-container mb-10 rounded-md"
						style="max-width: 500px; background-color: var(--fill-opacity-container);"
					>
						<div style="position:relative">
							{#each selectedTokens as t}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div class="token-row">
									<div class="flex gap-2 font-sm">
										<div class="">{t.amount}</div>
										<div class="">{ergoTokens[t.tokenId].ticker}</div>
									</div>
									<button class="py-1 px-3" on:click={() => removeFromDeposit(t.tokenId)}>
										<svg 											
										width="16"
										height="16"
										fill="currentColor"
										xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>
									</button>
								</div>
							{/each}
						</div>
					</div>

					<div class="select-token_wrapper">
						<button class="btn deposit">Deposit</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
<SelectCrypto></SelectCrypto>

<style lang="postcss">
	input{
		max-width: 500px;
	}
	.token-row:hover {
		background-color: var(--fill-opacity-container);
	}
	.btn {
		height: 48px;
		width: 100%;
		border: none;
		color: #fff;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.16s ease-in;
		background-color: #3b82f6;
	}
	.btn:hover {
		background-color: #2563eb;
	}
	.deposit {
		background-color: #1f2937;
		color: white;
	}
	.deposit:hover {
		background-color: #374151;
	}
	.select-token_wrapper {
		margin-bottom: 40px;
		max-width: 500px;
	}
	.select-token_currency {
		font-size: 14px;
		font-weight: 600;
	}
	.select-token_wrapper img {
		width: 24px;
		height: 24px;
		border-radius: 100%;
	}
	.select-token_wrapper .label {
		font-size: 14px;
		color: var(--text-secondary);
		opacity: 0.6;
	}
	.select-token_selectMode {
		height: 48px;
		border-radius: 4px;
		padding: 0 13px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.3s ease-in-out;
		cursor: pointer;
		background-color: var(--fill-opacity-container);
		border: 1px solid transparent;
	}
	.deposit_dot {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 24px;
		line-height: 28px;
	}
	.page-header {
		width: 1200px;
		@apply py-6 flex items-center;
	}
	.deposit_container {
		width: 1200px;
		background-color: var(--bg-level-secondary);
		margin: 0 auto 28px;
		padding: 40px;
		border-radius: 8px;
		min-height: 750px;
	}
	@media (max-width: 1240px) {
		.page-header {
			max-width: 100%;
		}
		.deposit_container {
			max-width: 100%;
		}
	}
	.title {
		margin-right: var(--margin-sm);
		margin-bottom: 0;
		color: var(--heading-color);
		font-weight: 600;
		font-size: 24px;
		line-height: var(--height-base);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.back-arrow {
		margin-right: 10px;
		font-size: 18px;
		cursor: pointer;
		width: 32px;
		height: 32px;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2px solid var(--text-primary);
		border-radius: 50%;
		transition: color 0.2s, border-color 0.2s;
	}
	.back-arrow:hover {
		color: var(--primary-base);
		border-color: var(--primary-base);
	}
	.token-row {
		height: 72px;
		margin-top: -2px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 16px 0 24px;
		overflow: hidden;
		width: 100%;
	}
	.select-token {
		cursor: pointer;
	}
	.select-token:hover {
		background-color: var(--fill-opacity-container);
	}
	.scroll-container {
		display: grid;
		overflow: auto;
		height: 350px;
	}
</style>

