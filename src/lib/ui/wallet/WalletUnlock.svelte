<script lang="ts">
	let showDialog = true;
	const closeDialog = () => (showDialog = false);
    let fillColor = 'var(--fill-opacity-container)';

	let password="123"

	function unlockWallet(){

	}
</script>

{#if showDialog}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="dialog-overlay" on:click={closeDialog}>
		<div class="dialog-content" on:click|stopPropagation>
			<button class="close-btn" on:click={closeDialog}>&times;</button>
			<h2>Unlock Wallet</h2>
			<div class="icon-container">
				<svg xmlns="http://www.w3.org/2000/svg" width="150" viewBox="0 0 512 512"
					><path
                        fill={fillColor}
						d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16H448c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zM416 272a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
					/></svg
				>
			</div>
			<!-- svelte-ignore a11y-autofocus -->
			<input
				autofocus
				id="wallet-password"
				class="ant-input ant-input-lg"
				type="password"
				placeholder="Enter your wallet password"
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
