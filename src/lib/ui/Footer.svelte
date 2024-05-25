<script>
	import Network from "./footer/Network.svelte";
</script>
<div class="footer">
	<Network></Network>
	<div class="flex gap-2">
		<div>Github</div>
		<div>KYA</div>
	</div>
</div>

<style lang="postcss">
	.footer {
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
	}
</style>
