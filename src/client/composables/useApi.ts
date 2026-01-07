const API_BASE = '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json() as ApiResponse<T>

  if (!json.success || !json.data) {
    throw new Error(json.error || 'Request failed')
  }

  return json.data
}

export function useApi() {
  async function get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`)
    return handleResponse<T>(response)
  }

  async function post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  }

  async function patch<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    return handleResponse<T>(response)
  }

  async function del<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
    })
    return handleResponse<T>(response)
  }

  return {
    get,
    post,
    patch,
    delete: del,
  }
}
