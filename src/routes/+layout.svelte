<script lang="ts">
	import { onMount } from 'svelte';
		import { Buffer } from 'buffer';
	import '../app.css';
	import '../mxui.css';
	import Header from '$lib/ui/header/Header.svelte';
	import Footer from '$lib/ui/footer/Footer.svelte';
	import { Toaster } from 'svelte-french-toast';

	onMount(()=>{
		(window as any).Buffer = Buffer;
	})

</script>

<Toaster />
<Header></Header>
<slot />
<Footer></Footer>