<script>
	import Network from "./footer/Network.svelte";
</script>
<div class="footer">
	<Network></Network>
	<div class="flex items-center gap-4">
		<a href="https://github.com/SavonarolaLabs/crystal-pool" target="_blank">Github</a>
		<a href="https://github.com/SavonarolaLabs/crystal-pool/tree/main/src/lib/contracts" target="_blank">Contracts</a>
		<a href="https://savonarolalabs.github.io/crystal-pool/#/" target="_blank">Docs</a>
		<a href="https://savonarolalabs.github.io/crystal-pool/#/05-KYA" target="_blank">KYA</a>
	</div>
</div>

<style lang="postcss">
	.footer {
		z-index: 10;
		border-top: 1px solid var(--divider-primary);
		background-color: var(--bg-level-secondary);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-left: 16px;
		padding-right: 16px;
		position: fixed;
		height: 32px;
    	margin: 0 auto;
		bottom: 0;
		width: 100%;
		font-size: 12px;
		line-height: 14px;
	}
	a{
		color: var(--text-primary)
	}
</style>
