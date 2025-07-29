/**
 * 管理路由 - 简化版
 */

import { Hono } from 'hono'
import { AdminService } from '../services/admin'
import { createSuccessResponse } from '../utils/response'
import { AdminAuthRequest, AddProviderRequest, EditProviderRequest, SelectModelRequest, AddClaudeAccountRequest, ClaudeAccountOAuthRequest } from '../../../../shared/types/admin'
import { ValidationError } from '../utils/errors'
import type { Bindings } from '../types/env'

const adminRoutes = new Hono<{ Bindings: Bindings }>()

// 管理员认证
adminRoutes.post('/auth', async (c) => {
  const { username, password }: AdminAuthRequest = await c.req.json()
  
  if (!username || !password) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '用户名和密码不能为空'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const isValid = await adminService.verifyAdmin(username, password, c.env)
  
  if (!isValid) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '用户名或密码错误'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  return createSuccessResponse({ authenticated: true }, '登录成功')
})

// 获取仪表板数据
adminRoutes.get('/dashboard', async (c) => {
  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const data = await adminService.getDashboardData()
  
  return createSuccessResponse(data, '获取仪表板数据成功')
})

// 获取所有模型供应商
adminRoutes.get('/providers', async (c) => {
  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const providers = await adminService.getProviders()
  
  return createSuccessResponse(providers, '获取供应商列表成功')
})

// 添加模型供应商
adminRoutes.post('/providers', async (c) => {
  const request: AddProviderRequest = await c.req.json()
  
  if (!request.name || !request.type || !request.endpoint || !request.apiKey) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少必填字段'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const provider = await adminService.addProvider(request)
  
  return createSuccessResponse(provider, '添加供应商成功')
})

// 编辑模型供应商
adminRoutes.put('/providers/:id', async (c) => {
  const id = c.req.param('id')
  const request: EditProviderRequest = await c.req.json()
  
  if (!id) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少供应商 ID'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  if (!request.name || !request.endpoint || !request.apiKey || !request.model) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少必填字段'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const provider = await adminService.editProvider(id, request)
  
  return createSuccessResponse(provider, '编辑供应商成功')
})

// 删除模型供应商
adminRoutes.delete('/providers/:id', async (c) => {
  const id = c.req.param('id')
  
  if (!id) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少供应商 ID'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  await adminService.deleteProvider(id)
  
  return createSuccessResponse(null, '删除供应商成功')
})

// 获取可用模型列表
adminRoutes.get('/models', async (c) => {
  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const models = await adminService.getAvailableModels()
  
  return createSuccessResponse(models, '获取模型列表成功')
})

// 选择模型
adminRoutes.post('/select-model', async (c) => {
  const { modelId, type, providerId }: SelectModelRequest = await c.req.json()
  
  if (!modelId || !type) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少模型 ID 或类型'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  if (type === 'provider' && !providerId) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '选择供应商模型时需要提供 providerId'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const selectedModel = await adminService.selectModel(modelId, type, providerId)
  
  return createSuccessResponse(selectedModel, '选择模型成功')
})

// ==================== Claude 账号管理端点 ====================

// 获取所有 Claude 账号
adminRoutes.get('/claude-accounts', async (c) => {
  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const accounts = await adminService.getClaudeAccounts()
  
  return createSuccessResponse(accounts, '获取 Claude 账号列表成功')
})

// 添加 Claude 账号
adminRoutes.post('/claude-accounts', async (c) => {
  const request: AddClaudeAccountRequest = await c.req.json()
  
  if (!request.name) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '账号名称不能为空'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const account = await adminService.addClaudeAccount(request)
  
  return createSuccessResponse(account, '添加 Claude 账号成功')
})

// 删除 Claude 账号
adminRoutes.delete('/claude-accounts/:id', async (c) => {
  const id = c.req.param('id')
  
  if (!id) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少账号 ID'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  await adminService.deleteClaudeAccount(id)
  
  return createSuccessResponse(null, '删除 Claude 账号成功')
})

// 生成 OAuth 授权链接
adminRoutes.post('/claude-accounts/generate-auth', async (c) => {
  const { accountId } = await c.req.json()
  
  if (!accountId) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少账号 ID'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  const authData = await adminService.generateClaudeAccountAuth(accountId)
  
  return createSuccessResponse(authData, '生成授权链接成功')
})

// 交换授权码获取 token
adminRoutes.post('/claude-accounts/exchange-token', async (c) => {
  const request: ClaudeAccountOAuthRequest = await c.req.json()
  
  if (!request.accountId || !request.code || !request.pkce) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少必填参数'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  await adminService.exchangeClaudeAccountToken(request)
  
  return createSuccessResponse(null, '令牌交换成功')
})

// 刷新账号 token
adminRoutes.post('/claude-accounts/:id/refresh', async (c) => {
  const id = c.req.param('id')
  
  if (!id) {
    return c.json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: '缺少账号 ID'
      },
      timestamp: new Date().toISOString()
    }, 400)
  }

  const adminService = new AdminService(c.env.CLAUDE_RELAY_ADMIN_KV)
  await adminService.refreshClaudeAccountToken(id)
  
  return createSuccessResponse(null, '令牌刷新成功')
})

export { adminRoutes }