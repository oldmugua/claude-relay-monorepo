export default defineNuxtConfig({
  // 兼容性日期
  compatibilityDate: '2025-07-27',
  // 仅在开发模式启用devtools
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  
  // 精简的模块配置
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  
  // CSS 配置
  css: ['~/assets/css/main.css'],
  
  // 构建优化
  build: {
    transpile: []
  },
  
  // Vite 配置优化
  vite: {
    build: {
      // 启用CSS代码分割以优化加载性能
      cssCodeSplit: true,
      // 配置chunk分割策略
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue']
          }
        }
      },
      // 减少chunk大小阈值
      chunkSizeWarningLimit: 1000
    },
    // WSL 环境下的热重载配置
    server: {
      watch: {
        usePolling: true,
        interval: 100
      }
    }
  },
  
  // Cloudflare Pages 部署配置
  nitro: {
    preset: 'cloudflare-pages',
    // 预渲染优化
    prerender: {
      crawlLinks: false
    },
    // 路由缓存规则
    routeRules: {
      // 首页预渲染，构建时生成静态HTML
      '/': { prerender: true },
      // 静态资源长期缓存
      '/_nuxt/**': { headers: { 'cache-control': 'max-age=31536000' } },
      // API路由不适用于前端，这里移除
    }
  },
  
  // 环境变量配置
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8787',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Claude Relay Frontend',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '1.0.0',
      nodeEnv: process.env.NODE_ENV || 'production'
    }
  },
  
  // Tailwind CSS 配置
  tailwindcss: {
    cssPath: '~/assets/css/main.css'
  }
})