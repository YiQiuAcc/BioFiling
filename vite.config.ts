import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import { TDesignResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [
          TDesignResolver({
            library: 'vue-next',
          }),
        ],
      }),
      Components({
        resolvers: [
          TDesignResolver({
            library: 'vue-next',
          }),
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/client'),
      },
    },
    server: {
      port: 8080,
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 3000}`,
          changeOrigin: true,
        },
      },
    },
  }
})
