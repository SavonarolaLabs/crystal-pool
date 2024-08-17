<script>
	import { ergoTokens } from '$lib/constants/ergoTokens';
	import { crystalwallet_tokens, show_wallet_unlock_dialog } from '$lib/ui/ui_state';
</script>

<div class="flex flex-col items-center">
	<div class="page-header flex items-center">
		<div class="title">Assets</div>
	</div>
	<div class="page_container">
		<div class="flex justify-between py-2 px-8 items-center label">
			<div class="flex items-center gap-3" style="width:210px;">Asset</div>
			<div class="amount pr-2" style="width:120px;">Total</div>
			<div class="amount pr-2" style="width:120px;">Available</div>
			<div class="amount pr-2" style="width:120px;">Frozen</div>
			<div class="flex gap-2" style="width:160px;">Action</div>
		</div>
		{#each Object.keys(ergoTokens) as k}
			<div class="flex justify-between row py-2 px-8 items-center">
				<div class="flex items-center gap-3" style="width:210px;">
					<div style="width:32px;">
						<img
							style="width:32px;"
							alt=""
							src={ergoTokens[k].logoURI ? ergoTokens[k].logoURI : `/token/${k}.svg`}
						/>
					</div>
					<div>
						<div class="select-token_currency">{ergoTokens[k].ticker}</div>
						<div class="label">{ergoTokens[k].name}</div>
					</div>
				</div>
				<div class="amount pr-2" style="width:120px;">
					<div>{$crystalwallet_tokens.find((t) => t.tokenId == k)?.amount ?? 0}</div>
					<div class="label">≈ 0.00 USD</div>
				</div>
				<div class="amount pr-2" style="width:120px;">
					<div>{$crystalwallet_tokens.find((t) => t.tokenId == k)?.amount ?? 0}</div>
					<div class="label">≈ 0.00 USD</div>
				</div>
				<div class="amount pr-2" style="width:120px;">
					<div>{0}</div>
					<div class="label">≈ 0.00 USD</div>
				</div>
				<div class="flex gap-2">
					{#if $crystalwallet_tokens}
						<!-- svelte-ignore a11y-interactive-supports-focus -->
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-missing-attribute -->
						<a
							role="button"
							style="	text-decoration-line: underline;"
							on:click={() => {
								show_wallet_unlock_dialog.set(true);
							}}>unlock wallet</a
						>
					{:else}
						<a href="/assets/deposit?token={ergoTokens[k].ticker}">deposit</a>
						<a href="/assets/withdraw?token={ergoTokens[k].ticker}">withdraw</a>
					{/if}

					<a href="/">trade</a>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.page_container {
		padding-left: 0px;
		padding-right: 0px;
	}
	.row:hover {
		background-color: var(--fill-container);
	}
	.label {
		font-size: 14px;
		color: var(--text-secondary);
	}
</style>
