<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let showDialog = true;
	const closeDialog = () => (showDialog = false);

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			closeDialog();
		} else if (event.key === 'Escape') {
			closeDialog();
		}
	}

	function selectCrypto(coin) {
		dispatch('message', { coin });
		closeDialog();
	}

	onMount(async () => {
		document.addEventListener('keydown', handleKeydown);
	});
</script>

{#if showDialog}
	<div class="dialog-overlay">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="dialog-content shadow-s2-down" on:click|stopPropagation>
			<div class="w-full flex justify-between items-center" style="height:60px;">
				<h2>Select Crypto to Deposit</h2>
				<button
					type="button"
					on:click={closeDialog}
					aria-label="Close"
					class="ant-modal-close"
					><span class="ant-modal-close-x"
						><svg
							focusable="false"
							width="1em"
							height="1em"
							fill="currentColor"
							aria-hidden="true"
							viewBox="0 0 1024 1024"
							data-icon="CloseOutlined"
							><path
								d="M512 592.440889l414.890667 414.890667 80.440889-80.440889L592.440889 512l414.890667-414.890667L926.890667 16.668444 512 431.559111 97.109333 16.668444 16.668444 97.109333 431.559111 512 16.668444 926.890667l80.440889 80.440889L512 592.440889z"
							></path></svg
						></span
					></button
				>
			</div>

			<div class="scroll-container">
				<div style="position:relative">
					<div class="select-token" on:click={() => selectCrypto('Ergo')}>
						<div class="flex items-center gap-2">
							<img
							style="width:32px;"
							alt=""
								src="https://www.mexc.com/api/file/download/F20210514192151938ROhGjOFp2Fpgb7"
							/><span class="select-token_currency">rsBTC</span><span class="label"
								>RosenBridge Bitcoin</span>
						</div>
						<div class="amount">
							<span style="margin-inline-end: 4px;">≈</span>
							0</div>
					</div>
					<div class="select-token" on:click={() => selectCrypto('rsBTC')}>
						<div class="coin">rsBTC</div>
						<div class="amount">0</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.coin {
		display: flex;
		align-items: center;
		width: calc(50% - 12px);
		-webkit-margin-end: 24px;
		margin-inline-end: 24px;
	}
	.amount {
		display: flex;
		flex-direction: column;
		align-items: end;
	}
	.select-token {
		height: 72px;
		margin-top: -2px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 16px 0 24px;
		cursor: pointer;
		width: 100%;
		overflow: hidden;
	}
	.select-token:hover{
		background-color: var(--fill-opacity-container);
	}
	.scroll-container {
		display: grid;
		overflow: auto;
		height: 350px;
	}

	.ant-modal-close {
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.ant-modal-close-x {
		display: block;
		width: var(--modal-header-close-size);
		height: var(--modal-header-close-size);
		font-size: var(--font-size-lg);
		font-style: normal;
		line-height: var(--modal-header-close-size);
		text-align: center;
		text-transform: none;
		text-rendering: auto;
	}

	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	.dialog-content {
		background-color: var(--bg-level-primary);
		padding-top: 0rem;
		border-radius: 8px;
		width: 90%;
		max-width: 400px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		position: relative;
		animation: slideUp 0.3s ease-out;
	}

	.close-btn {
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
		color: var(--text-color);
		margin-bottom: 0;
		padding-left: 2rem;
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
