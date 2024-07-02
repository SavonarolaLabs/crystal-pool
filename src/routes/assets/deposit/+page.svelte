<script>
	import { goto } from '$app/navigation';
	import DepositWeb3 from './DepositWeb3.svelte';
	import MobileDeposit from './MobileDeposit.svelte';
	
	//let selectedWallet = 'mobile';
	let selectedWallet = 'web3wallet';
</script>

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
		<div class="w-full flex justify-center">
		{#if selectedWallet == 'mobile'}
			<MobileDeposit></MobileDeposit>
		{:else}
			<DepositWeb3></DepositWeb3>
		{/if}
	</div>
	</div>
</div>

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

