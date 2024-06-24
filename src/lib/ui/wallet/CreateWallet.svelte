<script lang="ts">
	import { goto } from "$app/navigation";
	import { showToast } from "../header/toaster";
	import { setMnemonic } from "../ui_wallet";

	let mnemonic = `project story magnet again
rule trap holiday point
actress metal thrive wall`;
	let password = '';

    function createWallet(){
        showToast('Wallet created');
		//goto('/assets/deposit')
		console.log({mnemonic, password})
		setMnemonic(mnemonic, password);
    }
</script>

<div class="flex flex-col items-center">
	<div class="page-header flex items-center">
		<div class="back-arrow">&#8592;</div>
		<div class="title">Create Wallet</div>
	</div>
	<div class="deposit_container">
			<div class="deposit_dot">12 Word Mnemonic</div>
			<div class="select-token_wrapper">
				<textarea class="w-full ant-input" style="height:6em;resize: none; font-size:18px;" readonly={true}>{mnemonic}</textarea>
			</div>
			<div class="deposit_dot">Wallet Password</div>
            <div class="select-token_wrapper">
                <input class="w-full ant-input ant-input-lg" bind:value={password}>
            </div>
            <div class="select-token_wrapper flex items-center gap-2">
                <input type="checkbox" class="" id="confirm">
                <label for="confirm" style="user-select: none;">I have written down my 12 magic words.</label>
            </div> 
            
			<div class="select-token_wrapper">
				<button class="btn" on:click={createWallet}>Create</button>
			</div>
	</div>
</div>

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
