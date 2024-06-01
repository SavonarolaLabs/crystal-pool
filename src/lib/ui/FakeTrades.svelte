<script>
	import { onMount } from 'svelte';
	import { addRecentTrades } from './ui_state';

	function generateRandomTrade() {
		return {
			price: (Math.random() * (70000 - 68000) + 68000).toFixed(2),
			amount: (Math.random() * 2).toFixed(6),
			time: new Date().toLocaleTimeString(),
			side: Math.random() < 0.5 ? 'buy' : 'sell'
		};
	}

	onMount(() => {
		const interval = setInterval(() => {
			const newTrades = [generateRandomTrade()];
			addRecentTrades(newTrades);
		}, 1000 / 3); // 3 trades per second

		return () => clearInterval(interval);
	});
</script>
