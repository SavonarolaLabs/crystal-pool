<script lang="ts">
	import { goto } from '$app/navigation';
	import { showToast } from '../header/toaster';
	import { wallet_initialized } from '../ui_state';
	import { persistMnemonic } from '../ui_wallet';

	let fillColor = 'var(--fill-opacity-container)';
	let mnemonic = `project story magnet again
rule trap holiday point
actress metal thrive wall`;
	let password = '';
	let shake = false;
	let checked = false;

	function createWallet() {
		if (checked) {
			showToast('Wallet created');
			persistMnemonic(mnemonic, password);
			goto('/assets/deposit');
		} else {
			shake = true;
			setTimeout(() => (shake = false), 300);
		}
	}
</script>

<div class="flex flex-col items-center">
	<div class="page-header flex items-center">
		<button class="back-arrow" on:click={()=>goto('/wallet')}>&#8592;</button>
		<div class="title">Create Wallet</div>
	</div>
	<div class="deposit_container" style="height: 570px;">
		<div class="h-full flex items-center justify-center">
			{#if !$wallet_initialized}
				<div class="fade-in grow">
					<div class="deposit_dot">12 Word Mnemonic</div>
					<div class="select-token_wrapper">
						<textarea
							class="w-full ant-input"
							style="height:6em;resize: none; font-size:18px;"
							readonly={true}>{mnemonic}</textarea
						>
					</div>
					<div class="deposit_dot">Wallet Password</div>
					<div class="select-token_wrapper">
						<input class="w-full ant-input ant-input-lg" bind:value={password} />
					</div>
					<div class="select-token_wrapper flex items-center gap-2" class:shake>
						<input type="checkbox" id="confirm" bind:checked />
						<label for="confirm" style="user-select: none;"
							>I have written down my 12 magic words.</label
						>
					</div>

					<div class="select-token_wrapper">
						<button class="btn" on:click={createWallet}>Create</button>
					</div>
				</div>
				<div class="fade-in grow flex items-center justify-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="80%" viewBox="0 0 512 512">
						<path
							fill={fillColor}
							d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64H80c-8.8 0-16-7.2-16-16s7.2-16 16-16H448c17.7 0 32-14.3 32-32s-14.3-32-32-32H64zM416 272a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
						/>
					</svg>
				</div>
			{:else}
				<div class="fade-in text-lg">
					Your wallet is ready. <a href="/assets/deposit">Deposit Assets?</a>
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    .fade-in {
        opacity: 0;
        animation: fadeIn ease-in 150ms;
        animation-delay: 100ms;
        animation-fill-mode: forwards;
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
	.select-token_wrapper label {
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
		.main-container{
			padding-left: 2em;
			padding-right: 2em;
		}
		.page-header {
			max-width: 100%;
		}
		.deposit_container {
			width: 100%;
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
