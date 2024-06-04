import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
	plugins: [sveltekit(), wasm()],
	optimizeDeps: {
		include: ['ergo-lib-wasm-browser', 'buffer'],
	},
	build: {
		target: 'esnext' // without this wasm build doesn't work
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		server: {
			deps: {
				inline: ['@fleet-sdk/compiler'],
			},
		},
	},
	server: {
		watch: {
			// Include .es files in the watch list
			ignored: ['!**/*.es', '!**/*.ts'],
		}
	}
});
