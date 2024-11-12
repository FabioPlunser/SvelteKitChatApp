import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import injectSocketIO from './socket-handler';

export default defineConfig({
	plugins: [sveltekit(), {
		name: "sveltekit-socket-io",
		configureServer(server) {
			injectSocketIO(server.httpServer);
		}
	}]
});
