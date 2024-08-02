<script lang="ts">
	import { onMount } from 'svelte';
	import { initMnemonicWorker, mnemonicRequiresDecryption, onDecrypt } from '../ui_wallet';

	let showDialog = false;
	const closeDialog = () => (showDialog = false);
	let fillColor = 'var(--text-primary)';
	let password = '';
	let shake = false;

	async function unlockWallet() {
		if (await onDecrypt(password)) {
			closeDialog();
		} else {
			shake = true;
			setTimeout(() => (shake = false), 300);
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			unlockWallet();
		} else if (event.key === 'Escape') {
			closeDialog();
		}
	}

	onMount(async () => {
		document.addEventListener('keydown', handleKeydown);
		await initMnemonicWorker();
		showDialog = await mnemonicRequiresDecryption();
	});
</script>

{#if showDialog}
	<div class="dialog-overlay">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="dialog-content shadow-s2-down" on:click|stopPropagation>
			<button class="close-btn" on:click={closeDialog}>&times;</button>
			<h2>Unlock Wallet</h2>
			<div
				class="icon-container py-12 rounded-md"
				style="background: var(--fill-opacity-container)"
			>
				<svg
					fill={fillColor}
					opacity="0.9"
					height="100px"
					viewBox="0 0 119.81929 196.03868"
					xmlns="http://www.w3.org/2000/svg"
					><defs />
					<path
						d="M 34.174951 0 L 34.174951 22.078686 C 15.875262 22.022203 1.64462 22.285117 1.1466797 22.923388 C 0.2722386 24.044266 -1.1858236 42.431431 1.7367187 51.982812 C 4.3619966 60.56268 25.6169 90.831492 25.460278 98.16682 C 25.276787 106.76055 3.5241054 133.39213 1.2793457 143.56596 C -0.38871073 151.12603 0.85861815 170.88078 0.85861815 170.88078 C 0.85861815 170.88078 15.448477 171.19881 34.174951 171.46108 L 34.174951 195.93982 L 48.89995 195.93982 L 48.89995 171.64106 C 56.301337 171.71762 63.870155 171.77073 71.249999 171.78857 L 71.249999 196.03862 L 85.974998 196.03862 L 85.974998 171.76584 C 102.63409 171.65807 115.76427 171.2476 118.00039 170.25503 C 120.66925 163.36329 119.62151 147.26585 119.59331 136.47761 C 119.57141 128.09776 96.781033 127.83615 96.805833 136.21599 C 96.834033 145.75425 97.107681 144.25699 93.498924 147.22866 C 89.511498 150.51216 44.504013 150.26041 40.930248 147.02131 C 36.985053 143.44557 43.66625 117.51596 52.711083 111.0164 C 58.144322 107.11184 68.70354 108.2909 78.2864 106.64075 C 84.853723 105.50985 86.31427 88.760798 79.743407 87.907005 C 70.574156 86.715587 54.399396 87.129755 51.837621 84.106078 C 50.835577 82.923361 35.056019 52.984511 37.329711 45.660302 C 38.689932 41.278645 92.547156 41.407851 94.871043 42.945287 C 98.73431 45.501144 96.775524 49.097046 96.823924 56.914184 C 96.875554 65.253461 118.08997 63.060991 118.10847 54.681127 C 118.13667 41.936523 119.26913 25.698143 115.93386 24.923584 C 112.4001 24.102926 100.63831 23.442178 85.974998 22.961425 L 85.974998 0 L 71.249999 0 L 71.249999 22.560644 C 63.884139 22.394763 56.311142 22.270876 48.89995 22.189087 L 48.89995 0 L 34.174951 0 z "
					/>
				</svg>
			</div>
			<!-- svelte-ignore a11y-autofocus -->
			<input
				class:shake
				autofocus
				id="wallet-password"
				class="ant-input ant-input-lg"
				type="password"
				placeholder="Enter your wallet password"
				bind:value={password}
			/>
			<button class="mt-4 unlock-btn" on:click={unlockWallet}>Unlock</button>
		</div>
	</div>
{/if}

<style>
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	.dialog-content {
		background-color: var(--bg-level-primary);
		padding: 2rem;
		border-radius: 8px;
		width: 90%;
		max-width: 400px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		position: relative;
		animation: slideUp 0.3s ease-out;
	}

	.close-btn {
		position: absolute;
		top: 0.5rem;
		right: 1rem;
		font-size: 1.5rem;
		background: none;
		border: none;
		color: var(--text-color);
		cursor: pointer;
	}

	h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: var(--text-color);
		text-align: center;
	}

	.icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.wallet-icon {
		width: 60px;
		height: 60px;
		color: #3b82f6;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #bbb;
	}

	.unlock-btn {
		width: 100%;
		padding: 0.75rem;
		background-color: #3b82f6;
		color: #fff;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.unlock-btn:hover {
		background-color: #2563eb;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
