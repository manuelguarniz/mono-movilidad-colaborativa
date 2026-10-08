import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "node:path";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        plugins: [react(), svgr()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
        server: {
            host: "0.0.0.0",
            port: 5173,
            strictPort: false,
        },
        preview: {
            host: "0.0.0.0",
            port: 4173,
            strictPort: false,
        },
        define: {
            "import.meta.env.APP_ENV": JSON.stringify(mode),
        },
    });
});
