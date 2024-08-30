<script lang="ts">
	import { goto } from '$app/navigation';
	import { ergoTokens } from '$lib/constants/ergoTokens';
	import { asBigInt } from '$lib/utils/helper';
	import {
		connectWeb3Wallet,
		crystalwallet_locked,
		crystalwallet_tokens,
		crystalwallet_value,
		disconnectWeb3Wallet,
		show_wallet_unlock_dialog,
		wallet_initialized,
		web3wallet_available_wallets,
		web3wallet_connected,
		web3wallet_wallet_name
	} from '../ui_state';
	let menuOpen = false;
	let hoverTimeout;

	function handleMouseEnter() {
		clearTimeout(hoverTimeout);
		menuOpen = true;
		setZIndexTo10();
	}

	function handleMouseLeave() {
		hoverTimeout = setTimeout(() => {
			menuOpen = false;
		}, 200); // Adjust the delay as needed
	}

	function deposit() {
		menuOpen = false;
		goto('/assets/deposit');
	}

	function withdraw() {
		menuOpen = false;
		goto('/assets/withdraw');
	}

	function toToWalletOrAssets() {
		menuOpen = false;
		if ($crystalwallet_locked) {
			show_wallet_unlock_dialog.set(true);
		} else if ($wallet_initialized) {
			goto('/assets');
		} else {
			goto('/wallet/create');
		}
	}

	function clickOnBalance() {
		if ($crystalwallet_locked) {
			show_wallet_unlock_dialog.set(true);
		} else if ($wallet_initialized) {
			goto('/assets');
		} else {
			goto('/wallet');
		}
	}

	function unlockWallet() {
		show_wallet_unlock_dialog.set(true);
	}

	function createWallet() {
		menuOpen = false;
		goto('/wallet/create');
	}

	function restoreWallet() {
		menuOpen = false;
		goto('/wallet/restore');
	}

	let element;
	function setZIndexTo10() {
		const elements = document.querySelectorAll('.zfix');
		elements.forEach((element) => {
			element.style.zIndex = '10';
		});
		element.style.zIndex = '11';
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	bind:this={element}
	class="zfix relative inline-block text-left"
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
>
	<div>
		<button
			type="button"
			class="inline-flex w-full justify-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold"
			id="menu-button"
			aria-haspopup="true"
			on:click={toToWalletOrAssets}
		>
			Wallet
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
		</button>
	</div>

	<div
		class="shadow-s2-down dropdown {menuOpen ? 'show' : ''}"
		role="menu"
		aria-orientation="vertical"
		aria-labelledby="menu-button"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="balance text-xs" on:click={clickOnBalance}>
			<div class="flex items-center gap-2">
				Estimated Balance
				<svg
					fill="currentColor"
					height="1em"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 512 512"
					><path
						d="M432 320H400a16 16 0 0 0 -16 16V448H64V128H208a16 16 0 0 0 16-16V80a16 16 0 0 0 -16-16H48A48 48 0 0 0 0 112V464a48 48 0 0 0 48 48H400a48 48 0 0 0 48-48V336A16 16 0 0 0 432 320zM488 0h-128c-21.4 0-32.1 25.9-17 41l35.7 35.7L135 320.4a24 24 0 0 0 0 34L157.7 377a24 24 0 0 0 34 0L435.3 133.3 471 169c15 15 41 4.5 41-17V24A24 24 0 0 0 488 0z"
					/></svg
				>
			</div>
			<div class="balance-total text-xl py-2">
				{Number($crystalwallet_value) / 10 ** 9} ERG
			</div>
			<div>
				{#each $crystalwallet_tokens as token}
					{#if ergoTokens[token.tokenId]}
						<div>
							{ergoTokens[token.tokenId].amount /
								10 ** ergoTokens[token.tokenId].decimals} ergoTokens[token.tokenId].ticker
						</div>
					{/if}
				{/each}
			</div>
		</div>
		<div class="actions">
			{#if $wallet_initialized && !$crystalwallet_locked}
				<button class="deposit" on:click={deposit}>Deposit</button>
				<button class="withdraw" on:click={withdraw}>Withdraw</button>
			{:else if $crystalwallet_locked}
				<button class="deposit" on:click={unlockWallet}>Unlock Wallet</button>
			{:else}
				<button class="deposit" on:click={createWallet}>Create</button>
				<button class="withdraw" on:click={restoreWallet}>Restore</button>
			{/if}
		</div>
		<div class="divider"></div>
		{#if $web3wallet_connected}
			<a
				href="#"
				role="menuitem"
				tabindex="-1"
				style=""
				on:click={() => {
					disconnectWeb3Wallet();
				}}>Disconnect {$web3wallet_wallet_name}</a
			>
		{:else if $web3wallet_available_wallets.length}
			{#each $web3wallet_available_wallets as wallet}
				<a
					href="#"
					class="text-center"
					role="menuitem"
					tabindex="-1"
					style=""
					on:click={() => {
						connectWeb3Wallet(wallet);
					}}>Connect {wallet}</a
				>
			{/each}
		{/if}
	</div>
</div>

<style>
	.balance {
		margin-bottom: 0.5rem;
		padding: 1em;
		background-color: var(--fill-container);
		color: var(--text-secondary);
	}

	.balance-total {
		color: var(--text-primary);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.actions button {
		flex: 1;
		padding: 0.5rem;
		border: none;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.actions button.deposit {
		background-color: #3b82f6; /* Blue color */
		color: white;
	}

	.actions button.withdraw {
		background-color: #1f2937;
		color: white;
	}

	.actions button.deposit:hover {
		background-color: #2563eb;
	}

	.actions button.withdraw:hover {
		background-color: #374151;
	}

	.divider {
		height: 1px;
		background-color: var(--divider-primary); /* Slate-500 color */
		margin: 0.5rem -1rem; /* Negative margin to make it full width */
	}
</style>
