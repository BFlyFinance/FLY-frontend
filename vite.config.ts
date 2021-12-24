import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import reactSvgPlugin from "vite-plugin-react-svg";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), reactSvgPlugin()],
    server: {
        port: 4000,
        host: "0.0.0.0",
    },
    resolve: {
        alias: {
            process: "process/browser",
            stream: "stream-browserify",
            zlib: "browserify-zlib",
            util: "util",
        },
    },

    build: {
        // transform commonjs modules to es6 modules
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        // pack all js files into one
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
        target: ["esnext"],
    },
});
