<script>
	// @ts-nocheck
	import { mempool_size } from '../ui_state';
</script>

<span
	class="absolute text-xs pl-2 text-secondary"
	style="left:50%;transform: translateX(-50%); bottom:7px;"
	>Ergo Mempool Saturation: {$mempool_size.toString().padStart(8, '\u00A0')}
	/1000</span
>
<div class="progress-bar">
	<div class="progress" style="width: {($mempool_size ?? 0) / 10}%"></div>
</div>

<style>
	.progress-bar {
		height: 7px;
		width: 100%;
		border: 1px solid var(--divider-primary);
		border-left: none;
		border-right: none;
		border-bottom: none;
		padding: 1px;
		display: flex;
	}

	.progress {
		height: 100%;
		background-color: var(--text-color);
	}

	.text-secondary {
		color: var(--text-secondary);
	}
</style>
