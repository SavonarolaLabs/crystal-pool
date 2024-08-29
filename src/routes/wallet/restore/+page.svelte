<script lang="ts">
	import { ifWalletLockedGotoWallet } from '$lib/ui/ui_state';
	import RestoreWallet from '$lib/ui/wallet/RestoreWallet.svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		const walletLocked = await ifWalletLockedGotoWallet();
		if (walletLocked) return;
	});
</script>

<RestoreWallet></RestoreWallet>
