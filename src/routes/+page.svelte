<script>
	import Trading from '$lib/ui/trading/Trading.svelte';
	import Header from '$lib/ui/Header.svelte';
	import Footer from '$lib/ui/Footer.svelte';
	import { onMount } from 'svelte';
	import { initSocket } from '$lib/ui/service/crystalPoolSocket';
	import { fetchBalance } from '$lib/ui/ui_state';

	onMount(async ()=>{
		await initSocket();
		await fetchBalance();
	})
</script>

<Header></Header>
<Trading></Trading>
<Footer></Footer>

<style lang="postcss">
	:root {
		background-color: var(--bg-level-primary);
	}
</style>
