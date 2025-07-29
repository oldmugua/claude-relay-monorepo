// API 端点常量
export const API_ENDPOINTS = {
  // 系统端点
  HEALTH: '/health',
  
  // Claude API 代理端点（保持原路径兼容性）
  CLAUDE_MESSAGES: '/v1/messages',
  
  // 认证管理端点
  AUTH_URL: '/api/auth/url',           // 获取授权URL
  AUTH_TOKEN: '/api/auth/token',       // token 管理 (POST创建/GET查看)
  
  // 管理中心端点
  ADMIN_AUTH: '/api/admin/auth',       // 管理员认证
  ADMIN_DASHBOARD: '/api/admin/dashboard', // 仪表板数据
  ADMIN_PROVIDERS: '/api/admin/providers', // 模型供应商管理
  ADMIN_MODELS: '/api/admin/models',   // 可用模型列表
  ADMIN_SELECT_MODEL: '/api/admin/select-model', // 选择模型
  
  // Claude 账号管理端点
  ADMIN_CLAUDE_ACCOUNTS: '/api/admin/claude-accounts', // Claude 账号管理
  ADMIN_CLAUDE_GENERATE_AUTH: '/api/admin/claude-accounts/generate-auth', // 生成授权链接
  ADMIN_CLAUDE_EXCHANGE_TOKEN: '/api/admin/claude-accounts/exchange-token' // 交换授权码
} as const