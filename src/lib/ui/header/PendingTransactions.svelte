<script>
	import { onMount } from 'svelte';
	import { pending_deposits } from '../ui_state';
	let element;
	let spinnyLoader;

	onMount(() => {
		spinnyLoader.style.opacity = '0';
		setTimeout(() => {
			spinnyLoader.style.opacity = '1';
            element.classList.remove("blink");
		}, 1800 * 1.5);
	});
</script>

<div bind:this={element} class="flex justify-center border rounded-md p-2 blink">
	+{$pending_deposits.length} deposit{$pending_deposits.length>1?'s':''}
	<div bind:this={spinnyLoader} class="spinny-loader fade-in">
		<div class="spinny-circle"></div>
	</div>
</div>

<style>
	:root {
		--icon-size: 24px;
	}

	.blink {
		animation: double-blink 1.8s infinite ease-out;
	}

	@keyframes double-blink {
		0%, 50%, 100% {
			opacity: 1;
		}
		25%, 75% {
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
