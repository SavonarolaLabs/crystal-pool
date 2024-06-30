<script>
	import { goto } from '$app/navigation';
	import { ergoTokens } from '$lib/constants/ergoTokens';
	import SelectCrypto from '$lib/ui/assets/SelectCrypto.svelte';

	let tokenId = '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04';

	let selectCryptoDialogOpen = false;
	function selectCrypto() {
		selectCryptoDialogOpen = true;
	}
	function handleMessage(event) {
		tokenId = event.detail.coin;
	}
</script>

<SelectCrypto bind:showDialog={selectCryptoDialogOpen} on:message={handleMessage}></SelectCrypto>
<div class="flex flex-col items-center">
	<div class="page-header flex items-center">
		<button class="back-arrow" on:click={() => goto('/assets')}>&#8592;</button>
		<div class="title">Deposit</div>
	</div>
	<div class="deposit_container flex items-center">
		<div class=" grow">
			<div class="deposit_dot">Select Wallet</div>
			<div class="tabs select-token_wrapper">
				<input type="radio" id="htmlTwo" name="fav_language_two" value="HTMLTwo" checked />
				<label for="htmlTwo">Mobile</label>
				<input type="radio" id="cssTwo" name="fav_language_two" value="CSSTwo" />
				<label for="cssTwo">Web3 Wallet</label>
			</div>

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
						/><span class="select-token_currency">{ergoTokens[tokenId].ticker}</span
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
				<input class="w-full ant-input ant-input-lg" />
			</div>

			<div class="select-token_wrapper">
				<button class="btn" on:click={selectCrypto}>Deposit</button>
			</div>
		</div>
		<div class="grow flex justify-center">
			<img
				style="background:white;max-width:300px;"
				src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1920px-QR_code_for_mobile_English_Wikipedia.svg.png"
				alt=""
			/>
		</div>
	</div>
</div>
<SelectCrypto></SelectCrypto>

<style lang="postcss">
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
	.select-token_wrapper {
		margin-bottom: 40px;
		max-width: 500px;
	}
	.select-token_currency {
		ont-size: 14px;
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
</style>
