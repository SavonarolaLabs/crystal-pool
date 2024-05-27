import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
	plugins: [sveltekit(), wasm()],
	resolve: {
		alias: {
		  'ergo-lib-wasm-browser': 'node_modules/ergo-lib-wasm-browser/ergo_lib_wasm.js',
		}
	  },
	  optimizeDeps: {
		include: ['ergo-lib-wasm-browser', 'buffer']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
