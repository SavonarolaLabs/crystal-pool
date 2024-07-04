<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { wallet_initialized } from '../ui_state';
	import PendingTransactions from './PendingTransactions.svelte';
	let menuOpen = true;
	let hoverTimeout;

	function handleMouseEnter() {
		clearTimeout(hoverTimeout);
		menuOpen = true;
	}

	function handleMouseLeave() {
		hoverTimeout = setTimeout(() => {
			menuOpen = false;
		}, 200); // Adjust the delay as needed
	}

	function toToWalletOrAssets() {
		menuOpen = false;
		if ($wallet_initialized) {
			goto('/assets');
		} else {
			goto('/wallet/create');
		}
	}
	// for each tx values
	let counter = 0;
	let value = 0;
	let assetCount = 1;
	let txId = 'd1c3ddf35d140f1155d5997edc48564145905bc57cef8ec728bed2135332adbc';


	onMount(()=>{
		setInterval(()=>{
			counter += 1
		}, 1000)
	})
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="relative inline-block text-left"
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
			<PendingTransactions></PendingTransactions>
		</button>
	</div>

	<div
		class={`shadow-s2-down dropdown ${menuOpen ? 'show' : ''}`}
		role="menu"
		aria-orientation="vertical"
		aria-labelledby="menu-button"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="balance text-xs"
			on:click={() => ($wallet_initialized ? goto('/assets') : goto('/wallet'))}
		>
			<a
				target="_blank"
				href="https://explorer.ergoplatform.com/en/transactions/{txId}"
				style=""
			>
				<div class="flex justify-between">
					<div class="flex items-center gap-2">
						TX::{txId.slice(0, 3)}...{txId.slice(-4)}
						<svg
							fill="currentColor"
							height="1em"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
							><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
								d="M432 320H400a16 16 0 0 0 -16 16V448H64V128H208a16 16 0 0 0 16-16V80a16 16 0 0 0 -16-16H48A48 48 0 0 0 0 112V464a48 48 0 0 0 48 48H400a48 48 0 0 0 48-48V336A16 16 0 0 0 432 320zM488 0h-128c-21.4 0-32.1 25.9-17 41l35.7 35.7L135 320.4a24 24 0 0 0 0 34L157.7 377a24 24 0 0 0 34 0L435.3 133.3 471 169c15 15 41 4.5 41-17V24A24 24 0 0 0 488 0z"
							/></svg
						>
					</div>
					<div>{String(Math.floor(counter / 60)).padStart(2, '0')}:{String(counter % 60).padStart(2, '0')}</div>
				</div>
			</a>
			<div class="w-full text-end balance-total text-xl py-2 pulse-text">{value} ERG +{assetCount}</div>
		</div>
	</div>
</div>

<style>
	.pulse-text {
		animation: pulse 2.9s infinite;
	}
	@keyframes pulse {
		25% {
			opacity: 1;
		}
		50% {
			opacity: 0.1;
		}
		75% {
			opacity: 1;
		}
	}

	a {
		/* color: var(--text-secondary); */
		padding: 0;
	}
	a:hover {
		color: var(--primary-blue);
	}
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
</style>
