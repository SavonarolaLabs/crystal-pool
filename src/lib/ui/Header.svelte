<div class="header">
	<div class="header_wrapper">
		<div class="header_leftWrapper">
			<a
				href="http://localhost:5173/"
				class="header_logoContainer flex items-center"
			>
					<img
						width="30px"
						alt="crystal pool"
						src="logo.png"
				/>
				<div class="text-xl ml-1 text-2xl">
					POOL
				</div>
			</a>
			<div class="header_leftMenu">
				<div class="responsive-item-content">
					<a class="header_navItem" href="https://hodlbox.xyz/">
						<span>Hodlbox</span>
					</a>
					<div class="header_navItem">Markets</div>
					<div class="header_navItem">Contracts</div>
				</div>
			</div>
		</div>
		<!-- <div class="header_rightWrapper">right</div>
		<div class="header_asidePlaceholderArea">aside</div> -->
	</div>
</div>

<style lang="postcss">
	.header {
		font-family:
			-apple-system,
			BlinkMacSystemFont,
			Segoe UI,
			Roboto,
			Helvetica Neue,
			Helvetica,
			Arial,
			sans-serif;
		background-color: var(--bg-secondary);
		color: var(--title);
		font-size: 14px;
		font-feature-settings: 'tnum';
		font-variant: tabular-nums;
		line-height: 1.5715;
		margin: 0;
		color: var(--text-color);
		font-size: var(--font-size-base);
		font-family: var(--font-family);
		font-variant: var(--font-variant-base);
		line-height: var(--line-height-base);
		background-color: var(--body-background);
		font-feature-settings: var(--font-feature-settings-base);
	}
	.header_wrapper {
		background-color: var(--bg-level-secondary);
		color: var(--text-primary);
		font-weight: 500;
		display: flex;
		justify-content: space-between;
		-webkit-padding-start: 16px;
		padding-inline-start: 16px;
		position: relative;
		z-index: 999;
		border-bottom: 1px solid var(--divider-primary);
		height: 60px;
	}
	.header_leftWrapper {
		display: flex;
	}

	.header_logoContainer {
		color: inherit;
		text-decoration: none;
	}
	.header_logo {
		-webkit-margin-end: 20px;
		margin-inline-end: 20px;
		cursor: pointer;
		display: flex;
		align-items: center;
		position: relative;
	}

	.header_fullLogo {
		min-width: 104px;
		height: 20px;
	}

	.header_leftMenu {
		display: flex;
	}
	.responsive-item-content {
		width: fit-content;
	}

	.header_navItem {
		-webkit-margin-end: 20px;
		margin-inline-end: 20px;
		cursor: pointer;
		display: flex;
		align-items: center;
		position: relative;
	}

	.header_rightWrapper {
		display: flex;
		-webkit-padding-end: 16px;
		padding-inline-end: 16px;
	}
	.header_asidePlaceholderArea {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
	}
</style>
