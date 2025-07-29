/**
 * 异常处理中间件 - 统一捕获和处理异常
 */

import { createErrorResponse } from '../utils/response'
import { AppError, AuthError, ValidationError, TokenExpiredError } from '../utils/errors'
import { ERROR_TYPES, ERROR_STATUS_CODES } from '../../../../shared/constants/errors'

export const errorHandler = () => {
  return async (c: any, next: any) => {
    try {
      await next()
    } catch (error) {
      console.error(`Error in ${c.req.method} ${c.req.path}:`, error)
      
      // 处理自定义异常
      if (error instanceof AppError) {
        const status = ERROR_STATUS_CODES[error.errorType]
        return c.json({
          success: false,
          error: {
            type: error.errorType,
            message: error.message
          },
          timestamp: new Date().toISOString()
        }, status)
      }
      
      // 处理其他异常
      return c.json({
        success: false,
        error: {
          type: ERROR_TYPES.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : '未知错误'
        },
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}