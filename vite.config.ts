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
});
