<script lang="ts">
	import { ifWalletLockedGotoWallet } from '$lib/ui/ui_state';
	import CreateWallet from '$lib/ui/wallet/CreateWallet.svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		const walletLocked = await ifWalletLockedGotoWallet();
		if (walletLocked) return;
	});
</script>

<CreateWallet></CreateWallet>
