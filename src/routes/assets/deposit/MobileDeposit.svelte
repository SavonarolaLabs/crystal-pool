<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import DepositProxyQR from './DepositProxyQR.svelte';
	import { next_unlock_height, user_address } from '$lib/ui/ui_state';
	import { compileDepositProxyContract } from '$lib/compiler/compile-browser';

	let address = '';
	let ergoAddress = '';
	let unsubscribe;

	const AMOUNT_IN_ERG = 0.1; // Amount in ERG

	function getErgoAddress(addr: string) {
		if (!addr) {
			return '';
		}
		const ergoAddr = `${addr}&amount=${AMOUNT_IN_ERG}`;
		return ergoAddr;
	}

	function updateAddress(addr: string) {
		address = addr;
		ergoAddress = getErgoAddress(addr);
	}

	onMount(() => {
		if ($user_address) {
			const compiledAddress = compileDepositProxyContract($user_address, $next_unlock_height);
			updateAddress(compiledAddress);
		} else {
			unsubscribe = user_address.subscribe((a) => {
				if (a) {
					const compiledAddress = compileDepositProxyContract(a, $next_unlock_height);
					updateAddress(compiledAddress);
				}
			});
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<div class="flex justify-center items-center">
	<div class="">
		{#if ergoAddress}
			<DepositProxyQR address={ergoAddress}></DepositProxyQR>
		{:else}
			<div
				style="width: 300px;height:300px; background-color: var(--fill-container);"
				class="flex items-center justify-center"
			>
				<p>Creating address...</p>
			</div>
		{/if}
		<div class="mt-6"></div>
		<input class="ant-input ant-input-lg" style="width:300px;" value={address} readonly />
		<div class="mt-2 text-sm text-center text-gray-600">
			Min. Amount: <span class="font-bold">{AMOUNT_IN_ERG} ERG</span>
		</div>
	</div>
</div>
