<script>
	import Trading from '$lib/ui/trading/Trading.svelte';
	import Header from '$lib/ui/Header.svelte';
	import Footer from '$lib/ui/Footer.svelte';
</script>

<Header></Header>
<Trading></Trading>
<Footer></Footer>

<style lang="postcss">
	:root{
        background-color: var(--bg-level-primary);
	}
</style>