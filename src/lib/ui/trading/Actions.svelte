<div class="actions">
	<div class="actions_header">
		<div class="actions_headerTabActive">
				Spot
		</div>
        <div class="fee">
            Maker <span style="display: inline-block; direction: ltr;"
                >0.000%</span
            >
            / Taker
            <span style="display: inline-block; direction: ltr;"
                >0.000%</span
            >
        </div>
	</div>
</div>

<style lang="postcss">
	.actions {
	}
    .actions_header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--divider-primary);
        padding: 0 16px;
        flex-shrink: 0;
        line-height: 40px;
    }
    .actions_headerTabActive{
        font-weight: 600;
    }
    .fee{
        color: var(--tint-blue-base);
        background-color: var(--tint-blue-smooth);
        font-size: 12px;
        border-radius: 2px;
        padding: 0 6px;
        line-height: 20px;
    }
</style>
