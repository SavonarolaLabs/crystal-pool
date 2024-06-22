<script>
	import TradingView from '$lib/ui/trading/TradingView.svelte';
	import { onMount } from 'svelte';

	onMount(async ()=>{
		//await initSocket();
		//await fetchBalance();
	})
</script>

<TradingView></TradingView>

<style lang="postcss">
	:root {
		background-color: var(--bg-level-primary);
	}
</style>
