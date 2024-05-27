<script lang="ts">
	import { onMount } from 'svelte';
		import { Buffer } from 'buffer';
	import '../app.css';
	import '../mxui.css';

	onMount(()=>{

		// Make Buffer globally available
		(window as any).Buffer = Buffer;
	})

</script>

<slot />
