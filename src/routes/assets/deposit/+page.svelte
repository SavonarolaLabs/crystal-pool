<div class="flex flex-col items-center">
	<div class="page-header flex items-center">
		<div class="back-arrow">&#8592;</div>
		<div class="title">Deposit</div>
	</div>
	<div class="deposit_container">
		<div class="deposit_dot">Select Crypto</div>
		<div class="select-token_wrapper">
			<div class="select-token_selectMode">
				<div class="flex items-center gap-2">
					<img
						src="https://www.mexc.com/api/file/download/F20210514192151938ROhGjOFp2Fpgb7"
					/><span class="select-token_currency">rsBTC</span><label>Bitcoin on Steroids</label>
				</div>
				<svg
					class="-mr-1 h-5 w-5 text-gray-400"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
    .select-token_currency{
        ont-size: 14px;
    font-weight: 600;
    }
	.select-token_wrapper img{
		width: 24px;
		height: 24px;
		border-radius: 100%;
	}
    .select-token_wrapper label{
        font-size: 14px;
    color: var(--text-secondary);
    opacity: .6;
    }

	.select-token_selectMode {
		height: 48px;
		border-radius: 4px;
		padding: 0 13px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.3s ease-in-out;
		cursor: pointer;
		background-color: var(--fill-opacity-container);
		border: 1px solid transparent;
	}
	.deposit_dot {
		font-size: 20px;
		font-weight: 600;
		margin-bottom: 24px;
		line-height: 28px;
	}

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
	@media (max-width: 1240px) {
		.page-header {
			max-width: 100%;
		}
		.deposit_container {
			max-width: 100%;
		}
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
		border: 2px solid var(--text-primary);
		border-radius: 50%;
		transition:
			color 0.2s,
			border-color 0.2s;
	}
	.back-arrow:hover {
		color: var(--primary-base);
		border-color: var(--primary-base);
	}
</style>
