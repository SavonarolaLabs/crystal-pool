<script>
	import { mempool_size } from "../ui_state";
</script>

<div class="progress-bar">
	<div class="progress" style="width: {$mempool_size??0/10}%"></div>
</div>

<style>
	.progress-bar {
		width: 100%;
		height: 10px;
		background-color: var(--bg-primary);
		border: 1px solid var(--text-color);
		padding: 1px;
	}

	.progress {
		height: 100%;
		background-color: var(--text-color);
	}
</style>
