/**
 * 环境绑定类型定义
 */

export interface Bindings {
  // 环境变量
  NODE_ENV?: string
  
  // 管理员认证
  ADMIN_USERNAME?: string
  ADMIN_PASSWORD?: string
  
  // KV 存储
  CLAUDE_RELAY_ADMIN_KV: KVNamespace
}