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
	<div class="page_container">
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
	.deposit_dot {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 24px;
		line-height: 28px;
	}
</style>

