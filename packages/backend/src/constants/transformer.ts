/**
 * Claude 到 OpenAI 转换器专用常量定义
 * 这些常量仅用于后端转换逻辑，不需要前后端共享
 */

import type { FinishReason, StopReason } from '../types/transformer'

// 完成原因映射表
export const FINISH_REASON_MAPPING: Record<FinishReason, StopReason> = {
  stop: 'end_turn',
  length: 'max_tokens',
  tool_calls: 'tool_use',
  content_filter: 'stop_sequence'
}

// 消息 ID 前缀
export const MESSAGE_ID_PREFIX = 'msg_'

// 默认停止原因
export const DEFAULT_STOP_REASON: StopReason = 'end_turn'

// 流式事件类型
export const STREAM_EVENTS = {
  MESSAGE_START: 'message_start',
  MESSAGE_DELTA: 'message_delta',
  MESSAGE_STOP: 'message_stop',
  CONTENT_BLOCK_START: 'content_block_start',
  CONTENT_BLOCK_DELTA: 'content_block_delta',
  CONTENT_BLOCK_STOP: 'content_block_stop'
} as const

// 流式数据标识符
export const STREAM_DATA = {
  PREFIX: 'data: ',
  DONE: '[DONE]'
} as const