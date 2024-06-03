<script lang="ts">
	import WalletBalanceBar from './WalletBalanceBar.svelte';
	import { setUserAlice, setUserBob, toggleWallet, user_name } from './ui_state';

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
				<svg
					width="180px"
					viewBox="0 0 369.6551724137931 60.3448275862069"
					class="looka-1j8o68f"
					><defs id="SvgjsDefs1201"></defs><g
						id="SvgjsG1202"
						transform="matrix(0.6704980842911877,0,0,0.6704980842911877,-3.3524904214559386,-3.3524904214559386)"
						fill="currentColor"
						><path
							xmlns="http://www.w3.org/2000/svg"
							fill="currentColor"
							d="M95,52c0-12.871-5.692-24.431-14.682-32.318C72.431,10.692,60.871,5,48,5C24.29,5,5,24.29,5,48  c0,12.868,5.69,24.426,14.677,32.313C27.564,89.306,39.126,95,52,95c0.084,0,0.166-0.006,0.25-0.006S52.416,95,52.5,95  C75.972,95,95,75.972,95,52.5c0-0.084-0.006-0.166-0.006-0.25S95,52.084,95,52z M21.828,73.371  c-4.245-5.978-6.77-13.259-6.822-21.121c0.135-20.511,16.732-37.109,37.244-37.244c7.862,0.052,15.144,2.577,21.121,6.822  C80.224,28.473,84.5,37.758,84.5,48c0,20.126-16.374,36.5-36.5,36.5C37.758,84.5,28.473,80.224,21.828,73.371z M6,48  C6,24.841,24.841,6,48,6c9.858,0,18.926,3.422,26.1,9.13C67.637,11.242,60.076,9,52,9C28.29,9,9,28.29,9,52  c0,8.074,2.241,15.633,6.127,22.095C9.421,66.923,6,57.856,6,48z M52,89c-10.08,0-19.227-4.055-25.905-10.615  C32.269,82.854,39.838,85.5,48,85.5c20.678,0,37.5-16.822,37.5-37.5c0-8.162-2.646-15.731-7.115-21.905  C84.945,32.773,89,41.92,89,52C89,72.402,72.402,89,52,89z"
						></path></g
					><g
						id="SvgjsG1203"
						transform="matrix(2.4794998559362815,0,0,2.4794998559362815,77.76844989319382,-6.381102001992829)"
						fill="currentColor"
						><path
							d="M13.02 18.5 c-1.26 1.12 -2.9 1.7 -4.8 1.7 c-3.96 0 -7.32 -2.94 -7.32 -7.2 s3.36 -7.2 7.32 -7.2 c1.88 0 3.5 0.6 4.72 1.66 l-1.94 2.18 c-0.7 -0.48 -1.64 -0.82 -2.58 -0.82 c-2.46 0 -4.16 1.76 -4.16 4.18 s1.7 4.18 4.16 4.18 c0.98 0 1.98 -0.38 2.68 -0.94 z M21.42 9.44 c0.28 0 0.56 0 0.82 0.06 l0 3.02 c-0.24 -0.06 -0.52 -0.06 -0.72 -0.06 c-1.92 0 -3.46 1.38 -3.62 3.3 l0 4.24 l-3.16 0 l0 -10.4 l3.16 0 l0 2.54 c0.48 -1.56 1.68 -2.7 3.52 -2.7 z M32.300000000000004 9.56 l3.14 0 l-6.36 14.24 l-3.16 0 l1.92 -4.16 l-4.5 -10.08 l3.14 0 l2.92 6.68 z M41.10000000000001 12.879999999999999 c-0.28 -0.72 -0.7 -0.96 -1.16 -0.96 c-0.42 0 -0.84 0.24 -0.84 0.64 c0 0.38 0.24 0.6 0.7 0.76 l1.32 0.46 c1.48 0.54 2.98 1.08 2.98 3.16 c0 2.1 -2.1 3.3 -4.26 3.3 c-1.94 0 -3.76 -1.14 -4.2 -2.96 l2.48 -0.78 c0.26 0.58 0.72 1.24 1.72 1.24 c0.68 0 1.12 -0.44 1.12 -0.84 c0 -0.2 -0.16 -0.46 -0.66 -0.66 l-1.22 -0.44 c-2.08 -0.76 -3.06 -1.82 -3.06 -3.3 c0 -1.94 1.8 -3.08 3.78 -3.08 c2.02 0 3.36 1.1 3.96 2.76 z M50.78000000000001 17.36 c0.56 0 0.96 -0.08 1.4 -0.2 l0 2.62 c-0.44 0.2 -1.16 0.34 -2.22 0.34 c-1.74 0 -3.2 -0.58 -3.2 -3.78 l0 -4.14 l-1.46 0 l0 -2.6 l1.46 0 l0 -2.44 l3.16 0 l0 2.44 l2.22 0 l0 2.6 l-2.22 0 l0 4.14 c0 0.46 0.12 1.02 0.86 1.02 z M61.34000000000001 9.6 l3.16 0 l0 10.4 l-3.16 0 l0 -1.04 c-0.14 0.36 -1.08 1.24 -2.68 1.24 c-2.38 0 -5.12 -1.7 -5.12 -5.42 c0 -3.58 2.74 -5.36 5.12 -5.36 c1.6 0 2.54 0.92 2.68 1.14 l0 -0.96 z M59.12000000000001 17.42 c1.3 0 2.36 -0.9 2.36 -2.64 c0 -1.68 -1.06 -2.58 -2.36 -2.58 c-1.36 0 -2.52 0.92 -2.52 2.58 c0 1.72 1.16 2.64 2.52 2.64 z M69.70000000000002 5.859999999999999 l0 14.14 l-3.16 0 l0 -14.14 l3.16 0 z M82.9 6 c3.14 0 5.22 1.9 5.22 4.82 c0 2.88 -2.08 4.6 -5.22 4.6 l-1.76 0 l0 4.58 l-3.22 0 l0 -14 l4.98 0 z M82.70000000000002 12.68 c1.3 0 2.2 -0.46 2.2 -1.86 c0 -1.38 -0.9 -1.86 -2.2 -1.86 l-1.56 0 l0 3.72 l1.56 0 z M95 9.42 c2.36 0 5.48 1.78 5.48 5.42 c0 3.66 -3.12 5.36 -5.48 5.36 s-5.48 -1.7 -5.48 -5.36 c0 -3.64 3.12 -5.42 5.48 -5.42 z M95 12.2 c-1.2 0 -2.42 0.92 -2.42 2.64 c0 1.66 1.22 2.58 2.42 2.58 s2.44 -0.92 2.44 -2.58 c0 -1.72 -1.24 -2.64 -2.44 -2.64 z M107.36000000000001 9.42 c2.36 0 5.48 1.78 5.48 5.42 c0 3.66 -3.12 5.36 -5.48 5.36 s-5.48 -1.7 -5.48 -5.36 c0 -3.64 3.12 -5.42 5.48 -5.42 z M107.36000000000001 12.2 c-1.2 0 -2.42 0.92 -2.42 2.64 c0 1.66 1.22 2.58 2.42 2.58 s2.44 -0.92 2.44 -2.58 c0 -1.72 -1.24 -2.64 -2.44 -2.64 z M117.72 5.859999999999999 l0 14.14 l-3.16 0 l0 -14.14 l3.16 0 z"
						></path></g
					></svg
				>
			</a>
			<div class="header_leftMenu">
				<a
					class="header_navItem"
					target="_blank"
					href="https://explorer.ergoplatform.com/en/mempool"
				>
					Mempool
				</a>
				<a
					class="header_navItem"
					target="_blank"
					href="https://explorer.ergoplatform.com/en/addresses/t5UVmPtqprz5zN2M2X5fRTajpYD2CYuamxePkcwNFc2t9Yc3DhNMyB81fLAqoL7t91hzyYacMA8uVzkpTYTRdg4A6gZHFZxVsvLo"
				>
					Deposits
				</a>
			</div>
		</div>
		<div class="header_leftWrapper">
			<div class="header_leftMenu">
				<div class="balance">
					<WalletBalanceBar></WalletBalanceBar>
				</div>
				<div class="header_navItem">
					<button on:click={toggleWallet}>Wallet</button>
				</div>
				<div class="header_navItem">
					<button on:click={toggleTheme}>
						<svg
							viewBox="0 0 24 24"
							width="24"
							height="24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<defs>
								<mask id="moon-mask">
									<rect x="0" y="0" width="100%" height="100%" fill="white" />
									<circle cx="16" cy="8" r="8" fill="black" />
								</mask>
							</defs>
							<circle
								cx="12"
								cy="12"
								r="6"
								fill="currentColor"
								mask="url(#moon-mask)"
							/>
							<g stroke="currentColor" stroke-width="2">
								<line x1="12" y1="1" x2="12" y2="3" />
								<line x1="12" y1="21" x2="12" y2="23" />
								<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
								<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
								<line x1="1" y1="12" x2="3" y2="12" />
								<line x1="21" y1="12" x2="23" y2="12" />
								<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
								<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
		align-items: center;
	}
	.balance {
		margin-inline-end: 20px;
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
		color: inherit;
		text-decoration: none;
	}
	.header_navItem:hover {
		color: var(--text-primary);
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
