// 健康检查响应
export interface HealthResponse {
  status: 'ok'
  message: string
  version: string
  timestamp: string
}

// 错误响应
export interface ErrorResponse {
  error: string
  message: string
  timestamp: string
  requestId?: string
  stack?: string
}