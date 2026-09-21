import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: [
            {
                find: '@radix-ui/react-select',
                replacement: fileURLToPath(
                    new URL(
                        './node_modules/@radix-ui/react-select/dist/index.mjs',
                        import.meta.url,
                    ),
                ),
            },
            {
                find: 'lucide-react',
                replacement: fileURLToPath(
                    new URL(
                        './node_modules/lucide-react/dist/esm/lucide-react.mjs',
                        import.meta.url,
                    ),
                ),
            },
            {
                find: 'react-dom/client',
                replacement: fileURLToPath(
                    new URL(
                        './node_modules/react-dom/client.js',
                        import.meta.url,
                    ),
                ),
            },
            {
                find: 'react-dom',
                replacement: fileURLToPath(
                    new URL(
                        './node_modules/react-dom/index.js',
                        import.meta.url,
                    ),
                ),
            },
            {
                find: 'react/jsx-runtime',
                replacement: fileURLToPath(
                    new URL(
                        './node_modules/react/jsx-runtime.js',
                        import.meta.url,
                    ),
                ),
            },
            {
                find: 'react/jsx-dev-runtime',
                replacement: fileURLToPath(
                    new URL(
                        './node_modules/react/jsx-dev-runtime.js',
                        import.meta.url,
                    ),
                ),
            },
            {
                find: 'react',
                replacement: fileURLToPath(
                    new URL('./node_modules/react/index.js', import.meta.url),
                ),
            },
        ],
        dedupe: [
            'react',
            'react-dom',
            '@radix-ui/react-select',
            'lucide-react',
        ],
    },
})
