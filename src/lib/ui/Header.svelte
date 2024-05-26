<script lang="ts">
	function toggleTheme() {
		if (typeof document !== 'undefined') {
			const currentTheme = document.documentElement.getAttribute('data-theme');
			const newTheme = currentTheme === 'light' ? 'dark' : 'light';
			document.documentElement.setAttribute('data-theme', newTheme);
		}
	}
</script>

<div class="header">
	<div class="header_wrapper">
		<div class="header_leftWrapper">
			<a
				href="http://localhost:5173/"
				class="header_logoContainer flex items-center header_navItem"
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
				<a class="header_navItem" href="https://hodlbox.xyz/">
					Hodlbox
				</a>
				<div class="header_navItem">Markets</div>
				<div class="header_navItem">Contracts</div>
			</div>
		</div>
		<div class="header_leftWrapper">
			<div class="header_leftMenu">
				<div class="header_navItem">Wallet</div>
				<div class="header_navItem">
					<button on:click={toggleTheme}>
						<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
							<defs>
								<mask id="moon-mask">
									<rect x="0" y="0" width="100%" height="100%" fill="white"/>
									<circle cx="16" cy="8" r="8" fill="black"/>
								</mask>
							</defs>
							<circle cx="12" cy="12" r="6" fill="currentColor" mask="url(#moon-mask)"/>
							<g stroke="currentColor" stroke-width="2">
								<line x1="12" y1="1" x2="12" y2="3"/>
								<line x1="12" y1="21" x2="12" y2="23"/>
								<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
								<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
								<line x1="1" y1="12" x2="3" y2="12"/>
								<line x1="21" y1="12" x2="23" y2="12"/>
								<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
								<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
							</g>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.header {
		z-index: 10;
		position: sticky;
		top: 0;
		background-color: var(--bg-secondary);
		color: var(--title);
		font-size: 14px;
		font-feature-settings: 'tnum';
		font-variant: tabular-nums;
		line-height: 1.5715;
		margin: 0;
		color: var(--text-color);
		font-size: var(--font-size-base);
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
