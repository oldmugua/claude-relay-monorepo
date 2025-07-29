/**
 * Claude 到 OpenAI 转换器专用类型定义
 * 这些类型仅用于后端转换逻辑，不需要前后端共享
 */

// 基础类型
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'
export type ContentType = 'text' | 'image' | 'image_url' | 'tool_use' | 'tool_result'
export type FinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter'
export type StopReason = 'end_turn' | 'max_tokens' | 'tool_use' | 'stop_sequence'

// 内容块接口
export interface ContentBlock {
  type: ContentType
  text?: string
  tool_use_id?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  content?: string | ContentBlock[]
  source?: {
    type: 'base64'
    data: string
    media_type: string
  } | {
    type: 'url'
    url: string
    media_type?: string
  }
  image_url?: {
    url: string
  }
  media_type?: string
  cache_control?: {
    type: string
  }
}

// OpenAI 工具调用接口
export interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

// OpenAI 消息接口
export interface OpenAIMessage {
  role: MessageRole
  content: string | ContentBlock[]
  tool_call_id?: string
  tool_calls?: OpenAIToolCall[]
  cache_control?: {
    type: string
  }
}

// OpenAI 工具接口
export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

// OpenAI 聊天请求接口
export interface OpenAIChatRequest {
  messages: OpenAIMessage[]
  model: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
  tools?: OpenAITool[]
  tool_choice?: unknown
}

// Claude 请求接口
export interface ClaudeRequest {
  messages?: ClaudeMessage[]
  system?: string | ContentBlock[]
  model: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
  tools?: ClaudeTool[]
  tool_choice?: unknown
}

// Claude 消息接口
export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

// Claude 工具接口
export interface ClaudeTool {
  name: string
  description?: string
  input_schema: Record<string, unknown>
}

// OpenAI 响应接口
export interface OpenAIResponse {
  id: string
  model: string
  choices: {
    message: {
      content?: string
      tool_calls?: OpenAIToolCall[]
    }
    finish_reason?: FinishReason
  }[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
  }
}

// 流式响应块接口
export interface StreamChunk {
  id?: string
  model?: string
  choices?: {
    delta?: {
      content?: string
    }
    finish_reason?: FinishReason
  }[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
  }
}

// Claude 响应接口
export interface ClaudeResponse {
  id: string
  type: 'message'
  role: 'assistant'
  model: string
  content: ContentBlock[]
  stop_reason: StopReason
  stop_sequence: null
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// 流状态接口
export interface StreamState {
  hasStarted: boolean
  hasTextContentStarted: boolean
  buffer: string
  isCompleted: boolean
}