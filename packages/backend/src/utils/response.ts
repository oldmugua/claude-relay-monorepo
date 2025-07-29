/**
 * 响应工具函数 - 最简实现
 */

import { ErrorType, ERROR_MESSAGES, ERROR_STATUS_CODES } from '../../../../shared/constants/errors'

// 标准 JSON 响应
export function createJsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, anthropic-version, anthropic-beta'
    }
  })
}

// 成功响应
export function createSuccessResponse(data: any, message?: string) {
  return createJsonResponse({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  })
}

// 错误响应
export function createErrorResponse(
  errorType: ErrorType, 
  customMessage?: string,
  details?: any
) {
  const status = ERROR_STATUS_CODES[errorType]
  const message = customMessage || ERROR_MESSAGES[errorType]
  
  return createJsonResponse({
    success: false,
    error: {
      type: errorType,
      message,
      details
    },
    timestamp: new Date().toISOString()
  }, status)
}

