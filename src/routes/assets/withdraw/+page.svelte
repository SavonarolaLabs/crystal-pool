<script lang="ts">
	import {goto} from "$app/navigation"
	import WithdrawWidget from "./WithdrawWidget.svelte";
</script>
<div class="flex flex-col items-center">
	<div class="page-header flex items-center">
		<button class="back-arrow" on:click={() => goto('/assets')}>&#8592;</button>
		<div class="title">Withdraw</div>
	</div>
	<div class="page_container flex items-center justify-center">
			<WithdrawWidget></WithdrawWidget>
	</div>
</div>