<script lang="ts">
	import { ergoTokens } from '$lib/constants/ergoTokens';
	import SelectCrypto from '$lib/ui/assets/SelectCrypto.svelte';
	import { showToast } from '$lib/ui/header/toaster';
	import {
		connectWeb3Wallet,
		has_pending_transactions,
		loadUIState,
		loadWeb3WalletTokens,
		web3wallet_confirmedTokens,
		web3wallet_connected,
		web3wallet_wallet_name
	} from '$lib/ui/ui_state';
	import { pk } from '$lib/ui/ui_wallet';
	import { asBigInt } from '$lib/utils/helper';
	import { deposit } from '$lib/wallet/deposit';
	import { SAFE_MIN_BOX_VALUE } from '@fleet-sdk/core';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let tokenId = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';
	let selectedTokens = [];

	let selectCryptoDialogOpen = false;

	function selectCrypto() {
		selectCryptoDialogOpen = true;
	}

	function handleMessage(event) {
		tokenId = event.detail.coin;
		clickAdd();
	}

	function clickAdd() {
		const newToken = { tokenId: tokenId, amount: 0 };
		selectedTokens = [...selectedTokens.filter((t) => t.tokenId != tokenId), newToken];
		setTimeout(scrollToBottom, 100);
	}

	function removeFromDeposit(tokenId) {
		selectedTokens = selectedTokens.filter((t) => t.tokenId != tokenId);
	}

	async function onDepositClick() {
		if(selectedTokens.length == 0){
			selectCrypto();
			return;
		}
        const blockchainHeight = await ergo.get_current_height();
        const inputBoxes = await ergo.get_utxos();
        const changeAddress = await ergo.get_change_address();
        //const userPk = $pk;
        const userPk = changeAddress;
        const unlockHeight = 1_400_000;
        const nanoErg = SAFE_MIN_BOX_VALUE;
        const tx = deposit(
            blockchainHeight,
            inputBoxes,
            changeAddress,
            userPk,
            unlockHeight,
            selectedTokens,
            nanoErg
        )
        const transaction = await ergo.sign_tx(tx);
        console.log(transaction);
		has_pending_transactions.set(true)
	}

	function scrollToBottom() {
		const scrollDiv = document.getElementById('scroll');
		if (scrollDiv) {
			scrollDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
	}

	async function connectWeb3() {
		await connectWeb3Wallet();
	}

	function setMaxTokenValue(id) {
		let token = selectedTokens.find((t) => t.tokenId == id);
		if (token) {
			token.amount = $web3wallet_confirmedTokens.find((x) => x.tokenId == id)?.amount ?? 0;
			selectedTokens = selectedTokens;
		}
	}

	export function sumAssets(acc: any, asset: any) {
		const token = acc.find((t) => t.tokenId == asset.tokenId);
		if (token) {
			token.amount = asBigInt(token.amount) + asBigInt(asset.amount);
		} else {
			acc.push(asset);
		}
		return acc;
	}

	onMount(async () => {
		if ($web3wallet_connected) {
			await loadUIState();
		}
	});
</script>

<div class="flex flex-col" style="max-width:500px; width:100%">
	<div
		class="scroll-container mb-10 rounded-md border-2"
		style="border-color: var(--fill-opacity-container);"
	>
		{#if $web3wallet_connected}
			<div id="scroll" style="position:relative">
				{#each selectedTokens as t (t.tokenId)}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div in:fade out:fade>
						<div class="plus-minus_wrapper__ht_aW">
							<span class="ant-input-affix-wrapper ant-input-affix-wrapper-lg">
								<input
									placeholder="Amount"
									class="ant-input ant-input-lg"
									type="text"
									bind:value={t.amount}
								/>
								<span class="ant-input-suffix">
									<span>{ergoTokens[t.tokenId].ticker}</span>
									<img
										style="width:24px; height:24px;"
										src={ergoTokens[t.tokenId].logoURI
											? ergoTokens[t.tokenId].logoURI
											: `/token/${t.tokenId}.svg`}
										alt=""
									/>
								</span>
							</span>
						</div>
						<div class="flex justify-between px-3 pb-2">
							<div style="color: var(--primary-text);">
								Available: {$web3wallet_confirmedTokens.find(
									(ct) => ct.tokenId == t.tokenId
								)?.amount ?? 0}
							</div>
							<div class="flex gap-4">
								<button
									on:click={() => removeFromDeposit(t.tokenId)}
									class="underline"
									style="color: var(--primary-text);"
								>
									remove
								</button>
								<button
									on:click={() => setMaxTokenValue(t.tokenId)}
									class="underline"
									style="color: var(--tint-blue-base);">MAX</button
								>
							</div>
						</div>
					</div>
				{/each}

				<div class="growselect-token_wrapper">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div class="select-token_selectMode px-6" on:click={selectCrypto}>
						<div class="flex items-center gap-2">+ Add Asset</div>
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
			</div>
		{/if}
	</div>

	<div class="select-token_wrapper">
		{#if $web3wallet_connected}
			<button class="btn" on:click={onDepositClick}>Deposit</button>
		{:else}
			<button class="btn" on:click={connectWeb3}>Connect Wallet</button>
		{/if}
	</div>
</div>

<SelectCrypto bind:showDialog={selectCryptoDialogOpen} on:message={handleMessage} web3filter={true}></SelectCrypto>

<style lang="postcss">
	input {
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
	/* .deposit {
		background-color: #1f2937;
		color: white;
	}
	.deposit:hover {
		background-color: #374151;
	} */
	.select-token_wrapper {
		margin-bottom: 40px;
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
		transition:
			color 0.2s,
			border-color 0.2s;
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

	.scroll-container {
		display: grid;
		overflow: auto;
		height: 364px;
	}
</style>
