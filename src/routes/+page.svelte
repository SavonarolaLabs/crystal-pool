<script>
	import TradingView from '$lib/ui/trading/TradingView.svelte';
	import Header from '$lib/ui/Header.svelte';
	import Footer from '$lib/ui/Footer.svelte';
	import { onMount } from 'svelte';
	import { initSocket } from '$lib/ui/service/crystalPoolSocket';
	import { fetchBalance } from '$lib/ui/ui_state';

	onMount(async () => {
		await initSocket();
		await fetchBalance();
	});
</script>

<Header></Header>
<TradingView></TradingView>
<Footer></Footer>

<style lang="postcss">
	:root {
		background-color: var(--bg-level-primary);
	}
</style>
