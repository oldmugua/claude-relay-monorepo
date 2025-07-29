/**
 * 认证相关类型定义 - Claude Code 账号管理专用
 */

// PKCE 参数
export interface PKCEParams {
  codeVerifier: string
  codeChallenge: string
  state: string
}

// OAuth Token 数据（从认证服务器返回）
export interface OAuthTokenData {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}

// 存储的 Token 信息（包含计算后的过期时间等）
export interface StoredTokenInfo {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  scope: string
  token_type: string
  obtained_at: number
}