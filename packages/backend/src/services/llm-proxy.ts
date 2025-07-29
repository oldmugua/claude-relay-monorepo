/**
 * LLM代理服务 - 使用自定义转换器进行格式转换
 * 支持多种LLM供应商的统一API转换
 */

import { ClaudeToOpenAITransformer } from './claude-to-openai-transformer'

interface LLMProvider {
  name: string
  apiUrl: string
  apiKey: string
  model: string
  transformer: any // 对应的转换器实例
}

interface ClaudeRequest {
  model?: string
  messages: any[]
  max_tokens?: number
  temperature?: number
  stream?: boolean
  system?: string | any[]
}

export class LLMProxyService {
  private providers: Map<string, LLMProvider> = new Map()
  private transformers: Map<string, any> = new Map()

  constructor() {
    // 初始化转换器 - 使用自定义的Claude到OpenAI转换器
    this.transformers.set('claude-to-openai', new ClaudeToOpenAITransformer())
    // 移除硬编码的供应商注册，改为动态配置
  }

  /**
   * 注册LLM提供商
   */
  registerProvider(provider: LLMProvider) {
    this.providers.set(provider.name, provider)
  }

  /**
   * 从ModelProvider配置动态注册供应商
   */
  registerProviderFromConfig(provider: any) {
    const transformer = this.getTransformerForProvider(provider)
    this.registerProvider({
      name: provider.id,
      apiUrl: provider.endpoint,
      apiKey: provider.apiKey,
      model: provider.model,
      transformer: transformer
    })
  }

  /**
   * 根据供应商配置选择合适的转换器
   */
  private getTransformerForProvider(provider: any): any {
    // 使用供应商指定的转换器类型，默认为 'claude-to-openai'
    const transformerType = provider.transformer || 'claude-to-openai'
    return this.transformers.get(transformerType)
  }

  /**
   * 处理Claude请求并转发给指定提供商
   */
  async handleRequest(claudeRequest: ClaudeRequest, providerName: string, apiKey?: string): Promise<Response> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`)
    }

    // 使用提供的API Key或默认的
    const effectiveApiKey = apiKey || provider.apiKey
    if (!effectiveApiKey) {
      throw new Error(`API key required for provider ${providerName}`)
    }

    try {
      // 使用AnthropicTransformer进行请求转换
      // AnthropicTransformer.transformRequestOut: Claude格式 -> OpenAI格式
      const transformedRequest = provider.transformer.transformRequestOut(claudeRequest)
      
      // 使用provider中配置的模型覆盖请求中的模型
      transformedRequest.model = provider.model

      console.log(`🚀 转发到${providerName}: ${claudeRequest.stream ? '🌊' : '📄'}`)
      console.log('🔍 转换后的请求:', JSON.stringify(transformedRequest, null, 2))

      // 发送请求
      const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`,
          'User-Agent': 'Claude-Relay-LLM-Proxy/1.0'
        },
        body: JSON.stringify(transformedRequest)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ ${providerName}请求失败: ${response.status}`, errorText)
        throw new Error(`${providerName} API error: ${response.status}`)
      }

      const isStream = response.headers.get('Content-Type')?.includes('text/event-stream')

      if (isStream) {
        // 流式响应：使用转换器转换回Claude格式
        const transformedStream = await provider.transformer.convertStreamToClaudeFormat(response.body!)

        return new Response(transformedStream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      } else {
        // 非流式响应：使用转换器转换回Claude格式
        const providerResponse = await response.json()
        const claudeResponse = await provider.transformer.transformResponseIn(providerResponse)

        return new Response(JSON.stringify(claudeResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }

    } catch (error) {
      console.error(`${providerName}代理失败:`, error)
      throw error
    }
  }


  /**
   * 添加新的转换器到系统中
   */
  addTransformer(name: string, transformer: any) {
    this.transformers.set(name, transformer)
  }

  /**
   * 获取所有支持的供应商
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * 获取所有可用的转换器
   */
  getTransformers(): string[] {
    return Array.from(this.transformers.keys())
  }
}
