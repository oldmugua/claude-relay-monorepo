/**
 * 管理中心常量定义
 */

// API 端点
export const ADMIN_API_ENDPOINTS = {
  AUTH: '/api/admin/auth',
  DASHBOARD: '/api/admin/dashboard',
  PROVIDERS: '/api/admin/providers',
  MODELS: '/api/admin/models',
  SELECT_MODEL: '/api/admin/select-model'
} as const

// 预设供应商配置
export const PROVIDER_CONFIGS = {
  modelScope: {
    name: '魔搭',
    description: '魔搭社区',
    icon: 'from-blue-500 to-purple-600',
    endpoint: 'https://api-inference.modelscope.cn/v1/chat/completions',
    models: ['Qwen/Qwen3-Coder-480B-A35B-Instruct', 'Qwen/Qwen2.5-Coder-32B-Instruct', 'Qwen/Qwen2.5-72B-Instruct'],
    helpText: '请前往 https://www.modelscope.cn/ 注册并获取 API Key',
    transformer: 'claude-to-openai' as const
  },
  openai: {
    name: 'OpenAI Compatible',
    description: '兼容 OpenAI API 的其他服务',
    icon: 'from-gray-500 to-gray-700',
    endpoint: '',
    models: [],
    helpText: '请输入兼容 OpenAI API 格式的服务密钥',
    transformer: 'claude-to-openai' as const
  }
} as const

// 存储键
export const ADMIN_STORAGE_KEYS = {
  MODEL_PROVIDERS: 'admin_model_providers',
  SELECTED_MODEL: 'admin_selected_model',
  CLAUDE_ACCOUNTS: 'admin_claude_accounts'
} as const