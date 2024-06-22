<div class="flex flex-col items-center">
    <div class="page-header flex items-center">
        <div class="back-arrow">&#8592;</div>
        <div class="title">Deposit</div>
    </div>
    <div class="deposit_container"></div>
</div>
<style lang="postcss">
    .page-header {
        width: 1200px;
        @apply py-6 flex items-center;
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
    .back-arrow {
        margin-right: 10px;
        font-size: 18px;
        cursor: pointer;
		width: 32px;
		height: 32px;
		display: flex;
		justify-content: center;
		align-items: center;
		border:2px solid var(--text-primary);
		border-radius: 50%;
		transition: color 0.2s, border-color 0.2s;
    }
	.back-arrow:hover{
		color: var(--primary-base);
		border-color: var(--primary-base);
	} 
</style>
