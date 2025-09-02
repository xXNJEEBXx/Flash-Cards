export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiClientOptions {
  baseUrl: string
  authToken?: string
}

export class ApiClient {
  private baseUrl: string
  private authToken?: string
  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.authToken = opts.authToken
  }

  async call<T>(method: HttpMethod, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (this.authToken) headers['authorization'] = `Bearer ${this.authToken}`

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    } as RequestInit)

    const text = await res.text()
    if (!res.ok) {
      let detail: unknown
      try { detail = JSON.parse(text) } catch { detail = text }
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(detail)}`)
    }

    if (!text) return undefined as unknown as T
    try { return JSON.parse(text) as T } catch { return text as unknown as T }
  }
}
