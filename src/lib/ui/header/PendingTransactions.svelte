<script>
	import { onMount } from 'svelte';
	import { pending_deposits } from '../ui_state';
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
		<svg
			class="ml-2"
			width="1.5em"
			height="1.5em"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 512 512"
			><path
				fill="red"
				d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
			/></svg
		>
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
