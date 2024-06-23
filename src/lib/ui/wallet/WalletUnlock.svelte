<script lang="ts">
</script>

<div
	class="w-full h-full absolute top-0 left-0 flex items-center justify-center"
	style="z-index: 20; background-color:#000a"
>
	<div class="flex flex-col gap-6 p-4" style="z-index: 21; background-color: var(--bg-level-secondary);">
		<div class="text-xl">Unlock Wallet</div>
        <div>Wallet Password</div>
        <input class="w-full ant-input ant-input-lg" type="password">

        <button class="btn">unlock</button>
	</div>
</div>


<style>
    .btn {
		height: 48px;
		width: 100%;
		border: none;
		color: #fff;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.16s ease-in;
		background-color: #3b82f6;
	}
</style>