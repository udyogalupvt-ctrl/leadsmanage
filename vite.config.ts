import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		...tanstackStart({
			server: {
				entry: "server",
			},
		}),
		nitro({
			preset: "vercel",
		}),
		react(),
	],
	resolve: {
		tsconfigPaths: true,
	},
});

