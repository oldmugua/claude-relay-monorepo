/**
 * KV Namespace 验证中间件
 */
import { Context, Next } from 'hono'
import type { Bindings } from '../types/env'

export const kvValidator = () => {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    // 对所有路由进行 KV namespace 检查
    if (!c.env.CLAUDE_RELAY_ADMIN_KV) {
      const path = c.req.path
      console.error('KV namespace CLAUDE_RELAY_ADMIN_KV is not bound for path:', path)
      
      // 为 health 端点返回特定的错误格式
      if (path === '/health') {
        return c.json({
          status: 'unhealthy',
          message: 'Service configuration error',
          error: 'KV namespace not configured',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }, 500)
      }
      
      // 其他端点返回标准错误格式
      return c.json({
        success: false,
        error: {
          type: 'CONFIGURATION_ERROR',
          message: 'Service configuration error. Please contact administrator.',
          details: c.env.NODE_ENV === 'development' 
            ? 'KV namespace CLAUDE_RELAY_ADMIN_KV is not bound' 
            : undefined
        },
        timestamp: new Date().toISOString()
      }, 500)
    }
    
    await next()
  }
}