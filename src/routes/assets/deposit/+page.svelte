<div class="flex flex-col items-center">
    <div class="page-header">
    	<div class="title">Deposit</div>
    </div>
    <div class="deposit_container"></div>
</div>
<style lang="postcss">
    .page-header{
        width: 1200px;
        @apply py-6
    }
	.deposit_container {
		width: 1200px;
		background-color: var(--bg-level-secondary);
		margin: 0 auto 28px;
		padding: 40px;
		border-radius: 8px;
	}
	.title {
		margin-right: var(--margin-sm);
		margin-bottom: 0;
		color: var(--heading-color);
		font-weight: 600;
		font-size: 24px;
		line-height: var(--height-base);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
