<script>
	import { onMount } from 'svelte';
	import { pending_deposits } from '../ui_state';
	import WarningIcon from './WarningIcon.svelte';
	let element;
	let spinnyLoader;

	onMount(() => {
		if (spinnyLoader) {
			spinnyLoader.style.opacity = '0';
		}
		setTimeout(() => {
			if (spinnyLoader) {
				spinnyLoader.style.opacity = '1';
			}

			element.classList.remove('blink');
		}, 1800 * 1.5);
	});
</script>

{#if $pending_deposits.some((d) => d.action == 'PROXY_STUCK')}
	<div
		bind:this={element}
		class="flex items-center justify-center border rounded-md p-2 blink"
		style="border-color:red; color:red;"
	>
		+{$pending_deposits.length} deposit{$pending_deposits.length > 1 ? 's' : ''}
		<WarningIcon></WarningIcon>
	</div>
{:else}
	<div bind:this={element} class="flex justify-center border rounded-md p-2 blink">
		+{$pending_deposits.length} deposit{$pending_deposits.length > 1 ? 's' : ''}
		<div bind:this={spinnyLoader} class="spinny-loader fade-in">
			<div class="spinny-circle"></div>
		</div>
	</div>
{/if}

<style>
	.blob {
		background: red;
		border-radius: 50%;
		margin: 10px;
		height: 20px;
		width: 20px;

		box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
		transform: scale(1);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
		}

		70% {
			transform: scale(1);
			box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
		}

		100% {
			transform: scale(0.95);
			box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
		}
	}

	:root {
		--icon-size: 24px;
	}

	.blink {
		animation: double-blink 1.8s infinite ease-out;
	}

	@keyframes double-blink {
		0%,
		50%,
		100% {
			opacity: 1;
		}
		25%,
		75% {
			opacity: 0;
		}
	}

	.spinny-loader {
		display: inline-block;
		position: relative;
		width: var(--icon-size);
		height: var(--icon-size);
		margin: 0 10px;
		transition: opacity 0.5s ease-in;
	}

	.spinny-loader > div {
		position: absolute;
		top: 50%;
		left: 50%;
		display: block;
		width: calc(var(--icon-size) * 0.4286);
		height: calc(var(--icon-size) * 0.4286);
		transform: translate3d(-50%, -50%, 0);
		border-radius: 50%;
		background-color: var(--text-color);
	}

	.spinny-loader::before,
	.spinny-loader::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		display: block;
		border-radius: 50%;
		border-style: solid;
		border-width: calc(var(--icon-size) * 0.1071);
		border-color: var(--text-color) transparent var(--text-color) transparent;
	}

	.spinny-loader::after {
		width: var(--icon-size);
		height: var(--icon-size);
		animation: spinny 0.6s infinite ease-in-out alternate-reverse;
	}

	.spinny-loader::before {
		width: calc(var(--icon-size) * 0.7143);
		height: calc(var(--icon-size) * 0.7143);
		animation: spinny 0.6s infinite ease-in-out;
	}

	@keyframes spinny {
		0% {
			transform-origin: 50%;
			transform: translate3d(-50%, -50%, 0) rotateZ(0deg);
		}
		100% {
			transform: translate3d(-50%, -50%, 0) rotateZ(360deg);
		}
	}

	@keyframes spinny-green {
		0% {
			transform-origin: 50%;
			transform: translate3d(-50%, -50%, 0) rotateZ(0deg);
		}
		100% {
			transform: translate3d(-50%, -50%, 0) rotateZ(-360deg);
		}
	}
</style>
