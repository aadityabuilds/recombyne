import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },
    define: {
      // Handle CRA-style environment variables
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.REACT_APP_OPENAI_API_KEY': JSON.stringify(env.REACT_APP_OPENAI_API_KEY),
      'process.env.REACT_APP_NCBI_EMAIL': JSON.stringify(env.REACT_APP_NCBI_EMAIL),
      'process.env.REACT_APP_NCBI_TOOL_NAME': JSON.stringify(env.REACT_APP_NCBI_TOOL_NAME),
      'process.env.REACT_APP_USE_MOCK_API': JSON.stringify(env.REACT_APP_USE_MOCK_API),
    },
    server: {
      port: 3000,
      open: true,
    },
    resolve: {
      alias: {
        src: path.resolve(__dirname, "./src"),
      },
    },
  };
});
