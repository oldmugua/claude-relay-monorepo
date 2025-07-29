import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { adminRoutes } from './routes/admin'
import { claudeRoutes } from './routes/claude'
import { errorHandler } from './middleware/result-handler'
import { AdminService } from './services/admin'
import type { Bindings } from './types/env'

// ==================== 应用初始化 ====================
const app = new Hono<{ Bindings: Bindings }>()

// ==================== 中间件配置 ====================
// 全局异常处理中间件 - 放在最前面
app.use('*', errorHandler())

// CORS 配置 - 统一处理所有请求包括 OPTIONS 预检
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'anthropic-version', 'anthropic-beta'],
  credentials: false
}))

// ==================== 基础路由 ====================
// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok',
    message: 'Claude Relay Backend is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// ==================== 功能路由挂载 ====================
app.route('/api/admin', adminRoutes)

// Claude API 代理路由
app.route('/v1', claudeRoutes)

// ==================== 错误处理 ====================
// 统一错误处理
app.onError((err, c) => {
  console.error('Error:', err)
  
  const isDev = c.env.NODE_ENV === 'development'
  
  return c.json({
    success: false,
    error: {
      type: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      ...(isDev && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  }, 500)
})

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      type: 'RESOURCE_NOT_FOUND',
      message: 'The requested endpoint does not exist'
    },
    timestamp: new Date().toISOString()
  }, 404)
})

// ==================== Worker 导出 ====================
export default {
  fetch: app.fetch,
  
  // 定时任务 - Claude 账号 Token 自动刷新（每6小时执行一次）
  async scheduled(controller: any, env: Bindings, ctx: any) {
    console.log('定时任务开始执行 - Claude 账号 Token 自动刷新')
    
    try {
      const adminService = new AdminService(env.CLAUDE_RELAY_ADMIN_KV)
      
      // 获取所有 Claude 账号
      const accounts = await adminService.getClaudeAccounts()
      console.log(`发现 ${accounts.length} 个 Claude 账号`)
      
      let successCount = 0
      let failureCount = 0
      
      // 对每个账号尝试刷新 token
      for (const account of accounts) {
        try {
          console.log(`正在刷新账号: ${account.name} (${account.id})`)
          await adminService.refreshClaudeAccountToken(account.id)
          successCount++
          console.log(`✅ 成功刷新账号: ${account.name}`)
        } catch (error) {
          failureCount++
          console.error(`❌ 刷新账号 ${account.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
      }
      
      console.log(`定时任务执行完成 - 成功: ${successCount}, 失败: ${failureCount}`)
    } catch (error) {
      console.error(`定时任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}