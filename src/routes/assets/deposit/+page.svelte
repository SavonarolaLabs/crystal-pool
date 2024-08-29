<script>
	import { goto } from '$app/navigation';
	import { ifWalletLockedGotoWallet } from '$lib/ui/ui_state';
	import { onMount } from 'svelte';
	import DepositHistory from './DepositHistory.svelte';
	import DepositWeb3 from './DepositWeb3.svelte';
	import MobileDeposit from './MobileDeposit.svelte';

	let selectedWallet = 'web3wallet';

	const updateQueryParam = (wallet) => {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('selectedWallet', wallet);
			goto(url.pathname + url.search, { replaceState: true });
		}
	};

	onMount(async () => {
		const walletLocked = await ifWalletLockedGotoWallet();
		if (walletLocked) return;

		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const wallet = params.get('selectedWallet');
			if (wallet) {
				selectedWallet = wallet;
			} else {
				updateQueryParam(selectedWallet);
			}
		}
	});

	const handleWalletChange = (wallet) => {
		selectedWallet = wallet;
		updateQueryParam(wallet);
	};
</script>

<div class="h-full flex flex-col items-center">
	<div class="page-header flex items-center">
		<button class="back-arrow" on:click={() => goto('/assets')}>&#8592;</button>
		<div class="title">Deposit</div>
	</div>
	<div class="page_container" style="margin-bottom:5px;">
		<div>
			<div class="deposit_dot">Select Wallet</div>
			<div class="tabs select-token_wrapper">
				<input
					type="radio"
					id="mobile"
					name="fav_language"
					value="mobile"
					on:change={() => handleWalletChange('mobile')}
					checked={selectedWallet === 'mobile'}
				/>
				<label for="mobile">Mobile</label>
				<input
					type="radio"
					id="web3wallet"
					name="fav_language"
					value="web3wallet"
					on:change={() => handleWalletChange('web3wallet')}
					checked={selectedWallet === 'web3wallet'}
				/>
				<label for="web3wallet">Web3 Wallet</label>
			</div>
		</div>
		<div class="w-full flex justify-center grow">
			{#if selectedWallet === 'mobile'}
				<MobileDeposit />
			{:else}
				<DepositWeb3 />
			{/if}
		</div>
	</div>
	<DepositHistory />
</div>

<style lang="postcss">
	input {
		max-width: 500px;
	}
	.deposit_dot {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 24px;
		line-height: 28px;
	}
</style>
