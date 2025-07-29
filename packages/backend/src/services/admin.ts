/**
 * 管理服务 - 简化版
 */

import { ModelProvider, SelectedModel, DashboardData, AddProviderRequest, EditProviderRequest, ClaudeAccount, AddClaudeAccountRequest, ClaudeAccountOAuthRequest } from '../../../../shared/types/admin'
import { ADMIN_STORAGE_KEYS } from '../../../../shared/constants/admin'
import { StoredTokenInfo, PKCEParams, OAuthTokenData } from '../../../../shared/types/auth'
import { AuthError, ValidationError } from '../utils/errors'
import { OAUTH_CONFIG } from '../../../../shared/constants/oauth'

export class AdminService {
  constructor(private adminKv: KVNamespace) {}

  // 验证管理员凭据
  async verifyAdmin(username: string, password: string, env: any): Promise<boolean> {
    const adminUsername = env.ADMIN_USERNAME || 'admin'
    const adminPassword = env.ADMIN_PASSWORD || 'password123'
    
    return username === adminUsername && password === adminPassword
  }

  // 获取仪表板数据
  async getDashboardData(): Promise<DashboardData> {
    // 获取供应商数量
    const providersData = await this.adminKv.get(ADMIN_STORAGE_KEYS.MODEL_PROVIDERS)
    const providers: ModelProvider[] = providersData ? JSON.parse(providersData) : []
    const providerCount = providers.length

    // 获取当前选中的模型
    const selectedModelData = await this.adminKv.get(ADMIN_STORAGE_KEYS.SELECTED_MODEL)
    const currentModel: SelectedModel = selectedModelData 
      ? JSON.parse(selectedModelData)
      : { id: 'official', name: '官方 Claude', type: 'official' }

    // 获取 Claude 账号统计
    const claudeAccounts = await this.getClaudeAccounts()
    const claudeAccountsCount = claudeAccounts.length
    const activeClaudeAccounts = claudeAccounts.filter(account => account.status === 'active').length

    return {
      hasClaudeToken: activeClaudeAccounts > 0, // 有活跃账号即为有 token
      tokenExpired: false, // 简化：假设活跃账号的 token 都有效
      providerCount,
      activeConnections: 0, // 简化版暂时为 0
      currentModel,
      claudeAccountsCount,
      activeClaudeAccounts
    }
  }

  // 获取所有模型供应商
  async getProviders(): Promise<ModelProvider[]> {
    const data = await this.adminKv.get(ADMIN_STORAGE_KEYS.MODEL_PROVIDERS)
    return data ? JSON.parse(data) : []
  }

  // 添加模型供应商
  async addProvider(request: AddProviderRequest): Promise<ModelProvider> {
    const providers = await this.getProviders()
    
    // 检查是否已存在
    const exists = providers.some(p => p.name === request.name || p.endpoint === request.endpoint)
    if (exists) {
      throw new ValidationError('供应商名称或端点已存在')
    }

    const newProvider: ModelProvider = {
      id: Date.now().toString(),
      name: request.name,
      type: request.type,
      endpoint: request.endpoint,
      apiKey: request.apiKey,
      model: request.model,
      transformer: request.transformer,
      status: 'active',
      createdAt: Date.now()
    }

    providers.push(newProvider)
    await this.adminKv.put(ADMIN_STORAGE_KEYS.MODEL_PROVIDERS, JSON.stringify(providers))
    
    return newProvider
  }

  // 编辑模型供应商
  async editProvider(id: string, request: EditProviderRequest): Promise<ModelProvider> {
    const providers = await this.getProviders()
    const providerIndex = providers.findIndex(p => p.id === id)
    
    if (providerIndex === -1) {
      throw new ValidationError('供应商不存在')
    }

    // 更新供应商信息，保持原有的 id、type、status 和 createdAt
    const existingProvider = providers[providerIndex]
    const updatedProvider: ModelProvider = {
      ...existingProvider,
      name: request.name,
      endpoint: request.endpoint,
      apiKey: request.apiKey,
      model: request.model,
      transformer: request.transformer || 'claude-to-openai'
    }

    providers[providerIndex] = updatedProvider
    await this.adminKv.put(ADMIN_STORAGE_KEYS.MODEL_PROVIDERS, JSON.stringify(providers))
    
    return updatedProvider
  }

  // 删除模型供应商
  async deleteProvider(id: string): Promise<void> {
    const providers = await this.getProviders()
    const updatedProviders = providers.filter(p => p.id !== id)
    
    if (updatedProviders.length === providers.length) {
      throw new ValidationError('供应商不存在')
    }

    await this.adminKv.put(ADMIN_STORAGE_KEYS.MODEL_PROVIDERS, JSON.stringify(updatedProviders))
    
    // 如果删除的是当前选中的供应商，重置为官方模型
    const selectedModel = await this.getSelectedModel()
    if (selectedModel.type === 'provider' && selectedModel.providerId === id) {
      await this.selectModel('official', 'official')
    }
  }

  // 获取可用模型列表
  async getAvailableModels(): Promise<Array<{ id: string; name: string; type: 'official' | 'provider'; providerId?: string }>> {
    const models: Array<{ id: string; name: string; type: 'official' | 'provider'; providerId?: string }> = [
      { id: 'official', name: '官方 Claude', type: 'official' }
    ]

    const providers = await this.getProviders()
    for (const provider of providers.filter(p => p.status === 'active')) {
      models.push({
        id: provider.id,
        name: provider.name,
        type: 'provider',
        providerId: provider.id
      })
    }

    return models
  }

  // 获取当前选中的模型
  async getSelectedModel(): Promise<SelectedModel> {
    const data = await this.adminKv.get(ADMIN_STORAGE_KEYS.SELECTED_MODEL)
    return data 
      ? JSON.parse(data)
      : { id: 'official', name: '官方 Claude', type: 'official' }
  }

  // 选择模型
  async selectModel(modelId: string, type: 'official' | 'provider', providerId?: string): Promise<SelectedModel> {
    let modelName = '官方 Claude'
    
    if (type === 'provider' && providerId) {
      const providers = await this.getProviders()
      const provider = providers.find(p => p.id === providerId)
      if (!provider) {
        throw new ValidationError('供应商不存在')
      }
      modelName = provider.name
    }

    const selectedModel: SelectedModel = {
      id: modelId,
      name: modelName,
      type,
      providerId
    }

    await this.adminKv.put(ADMIN_STORAGE_KEYS.SELECTED_MODEL, JSON.stringify(selectedModel))
    return selectedModel
  }

  // ==================== Claude 账号管理方法 ====================

  // 获取所有 Claude 账号
  async getClaudeAccounts(): Promise<ClaudeAccount[]> {
    // 获取账号 ID 列表
    const accountIdsData = await this.adminKv.get('claude_account_ids')
    const accountIds: string[] = accountIdsData ? JSON.parse(accountIdsData) : []
    
    const accounts: ClaudeAccount[] = []
    
    // 并行获取所有账号数据
    await Promise.all(accountIds.map(async (id) => {
      try {
        const accountData = await this.adminKv.get(`claude_account:${id}`)
        if (accountData) {
          const account: ClaudeAccount = JSON.parse(accountData)
          
          // 检查 token 状态
          const tokenData = await this.adminKv.get(`claude_account_token:${id}`)
          if (tokenData) {
            try {
              const token: StoredTokenInfo = JSON.parse(tokenData)
              const isExpired = Date.now() > token.expires_at
              account.tokenInfo = {
                hasToken: true,
                isExpired,
                expiresAt: token.expires_at,
                obtainedAt: token.obtained_at,
                scope: token.scope
              }
              // 更新账号状态
              account.status = isExpired ? 'expired' : 'active'
            } catch (error) {
              account.tokenInfo = { hasToken: false, isExpired: true }
              account.status = 'inactive'
            }
          } else {
            account.tokenInfo = { hasToken: false, isExpired: true }
            account.status = 'inactive'
          }
          
          accounts.push(account)
        }
      } catch (error) {
        console.error(`Failed to load account ${id}:`, error)
      }
    }))
    
    // 按创建时间排序
    return accounts.sort((a, b) => b.createdAt - a.createdAt)
  }

  // 添加 Claude 账号
  async addClaudeAccount(request: AddClaudeAccountRequest): Promise<ClaudeAccount> {
    // 生成安全的 UUID
    const accountId = crypto.randomUUID()
    
    // 检查是否已存在同名账号
    const accounts = await this.getClaudeAccounts()
    const exists = accounts.some(account => account.name === request.name)
    if (exists) {
      throw new ValidationError('账号名称已存在')
    }

    const newAccount: ClaudeAccount = {
      id: accountId,
      name: request.name,
      description: request.description,
      status: 'inactive',
      createdAt: Date.now()
    }

    // 单独存储账号数据
    await this.adminKv.put(`claude_account:${accountId}`, JSON.stringify(newAccount))
    
    // 更新账号 ID 列表
    const accountIdsData = await this.adminKv.get('claude_account_ids')
    const accountIds: string[] = accountIdsData ? JSON.parse(accountIdsData) : []
    accountIds.push(accountId)
    await this.adminKv.put('claude_account_ids', JSON.stringify(accountIds))
    
    return newAccount
  }

  // 删除 Claude 账号
  async deleteClaudeAccount(id: string): Promise<void> {
    // 检查账号是否存在
    const accountData = await this.adminKv.get(`claude_account:${id}`)
    if (!accountData) {
      throw new ValidationError('账号不存在')
    }

    // 删除账号数据
    await this.adminKv.delete(`claude_account:${id}`)
    
    // 从账号 ID 列表中移除
    const accountIdsData = await this.adminKv.get('claude_account_ids')
    if (accountIdsData) {
      const accountIds: string[] = JSON.parse(accountIdsData)
      const updatedIds = accountIds.filter(accountId => accountId !== id)
      await this.adminKv.put('claude_account_ids', JSON.stringify(updatedIds))
    }
    
    // 删除对应的 token 数据和 PKCE 数据
    await this.adminKv.delete(`claude_account_token:${id}`)
    
    // 清理可能存在的 PKCE 数据（虽然有过期时间，但主动清理更好）
    const pkceKeys = await this.adminKv.list({ prefix: 'claude_oauth_pkce:' })
    for (const key of pkceKeys.keys) {
      const pkceData = await this.adminKv.get(key.name)
      if (pkceData) {
        const pkceInfo = JSON.parse(pkceData)
        if (pkceInfo.accountId === id) {
          await this.adminKv.delete(key.name)
        }
      }
    }
  }

  // 为账号生成 OAuth 授权链接
  async generateClaudeAccountAuth(accountId: string) {
    // 检查账号是否存在
    const accountData = await this.adminKv.get(`claude_account:${accountId}`)
    if (!accountData) {
      throw new ValidationError('账号不存在')
    }

    // 生成 PKCE 参数
    const pkce = await this.generatePKCE()
    
    const params = new URLSearchParams({
      code: 'true',
      client_id: OAUTH_CONFIG.CLIENT_ID,
      response_type: 'code',
      redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
      scope: OAUTH_CONFIG.SCOPES,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: 'S256',
      state: pkce.state
    })

    const authURL = `${OAUTH_CONFIG.AUTHORIZE_URL}?${params.toString()}`
    
    // 临时存储 PKCE 参数，用于后续 token 交换
    await this.adminKv.put(`claude_oauth_pkce:${pkce.state}`, JSON.stringify({
      accountId,
      pkce,
      createdAt: Date.now()
    }), { expirationTtl: 600 }) // 10分钟过期
    
    return {
      authUrl: authURL,
      pkce,
      instructions: '请在新窗口中完成授权，然后从地址栏复制 code 参数的值'
    }
  }

  // 交换授权码获取 token
  async exchangeClaudeAccountToken(request: ClaudeAccountOAuthRequest): Promise<void> {
    // 验证 PKCE 参数
    const pkceData = await this.adminKv.get(`claude_oauth_pkce:${request.pkce.state}`)
    if (!pkceData) {
      throw new AuthError('PKCE 参数已过期或无效')
    }

    const storedPkce = JSON.parse(pkceData)
    if (storedPkce.accountId !== request.accountId) {
      throw new AuthError('账号ID与PKCE参数不匹配')
    }

    // 清理授权码
    const cleanCode = this.cleanAuthCode(request.code)
    
    // 与 OAuth 提供商交换 token
    const response = await fetch(OAUTH_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Claude-CF-Worker/1.0)',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: OAUTH_CONFIG.CLIENT_ID,
        code: cleanCode,
        redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
        code_verifier: storedPkce.pkce.codeVerifier,
        state: storedPkce.pkce.state
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new AuthError(`令牌交换失败: ${response.status} ${errorText}`)
    }

    const tokenData: OAuthTokenData = await response.json()
    
    // 创建并保存 token 信息
    const tokenInfo = this.createTokenInfo(tokenData)
    await this.adminKv.put(`claude_account_token:${request.accountId}`, JSON.stringify(tokenInfo))
    
    // 更新账号状态
    const accountData = await this.adminKv.get(`claude_account:${request.accountId}`)
    if (accountData) {
      const account: ClaudeAccount = JSON.parse(accountData)
      account.status = 'active'
      account.lastActiveAt = Date.now()
      await this.adminKv.put(`claude_account:${request.accountId}`, JSON.stringify(account))
    }
    
    // 清理 PKCE 数据
    await this.adminKv.delete(`claude_oauth_pkce:${request.pkce.state}`)
  }

  // 刷新账号 token
  async refreshClaudeAccountToken(accountId: string): Promise<void> {
    const tokenData = await this.adminKv.get(`claude_account_token:${accountId}`)
    if (!tokenData) {
      throw new AuthError('未找到账号的令牌信息')
    }

    const currentToken: StoredTokenInfo = JSON.parse(tokenData)
    if (!currentToken.refresh_token) {
      throw new AuthError('未找到 refresh_token')
    }

    const response = await fetch(OAUTH_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'claude-cli/1.0.56 (external, cli)',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: currentToken.refresh_token,
        client_id: OAUTH_CONFIG.CLIENT_ID
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new AuthError(`刷新令牌失败: ${response.status} ${errorText}`)
    }

    const newTokenData: OAuthTokenData = await response.json()
    
    const newTokenInfo = this.createTokenInfo(newTokenData)
    await this.adminKv.put(`claude_account_token:${accountId}`, JSON.stringify(newTokenInfo))
    
    // 更新账号状态
    const accountData = await this.adminKv.get(`claude_account:${accountId}`)
    if (accountData) {
      const account: ClaudeAccount = JSON.parse(accountData)
      account.status = 'active'
      account.lastActiveAt = Date.now()
      await this.adminKv.put(`claude_account:${accountId}`, JSON.stringify(account))
    }
  }

  // ==================== 私有辅助方法 ====================

  // 生成 PKCE 参数
  private async generatePKCE(): Promise<PKCEParams> {
    const codeVerifier = this.generateRandomBase64UrlString(32)
    
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const hash = await crypto.subtle.digest('SHA-256', data)
    const codeChallenge = this.arrayBufferToBase64Url(hash)
    
    const state = this.generateRandomBase64UrlString(32)

    return { codeVerifier, codeChallenge, state }
  }

  // 创建 token 信息对象
  private createTokenInfo(tokenData: OAuthTokenData): StoredTokenInfo {
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      scope: tokenData.scope,
      token_type: tokenData.token_type || 'Bearer',
      obtained_at: Date.now()
    }
  }

  // 生成随机的 base64url 编码字符串
  private generateRandomBase64UrlString(length: number): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return this.arrayBufferToBase64Url(array.buffer)
  }

  // 将 ArrayBuffer 转换为 base64url 编码
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // 清理授权码，移除 URL 片段和参数
  private cleanAuthCode(code: string): string {
    return code.split('#')[0].split('&')[0].split('?')[0].trim()
  }
}