<script lang="ts">
	import { user_address, user_name, user_tokens } from './ui_state';

	function shortenAddress(str: string) {
		return str.length > 6 ? str.slice(0, 3) + '...' + str.slice(-3) : str;
	}
</script>

<div class="flex gap-4">
    {#if $user_address}
        <div>PK: {shortenAddress($user_address)} ({$user_name})</div>
    {/if}
	{#each $user_tokens as token}
		<div>{token.name}: {token.amount / 10 ** token.decimals}</div>
	{/each}
</div>
