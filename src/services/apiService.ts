// API Service - Centralized HTTP client with interceptors

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { auditLogger } from './auditLogger'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface ApiErrorResponse {
  message: string
  code: string
  timestamp: string
}

class ApiService {
  private axiosInstance: AxiosInstance
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    )
  }

  /**
   * Request interceptor - add auth token and logging
   */
  private async handleRequest(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    // Add auth token from localStorage if available
    const user = JSON.parse(localStorage.getItem('pspm_user') || 'null')
    if (user?.id) {
      config.headers.Authorization = `Bearer ${user.id}`
    }

    // Add company context
    const company = JSON.parse(localStorage.getItem('pspm_company') || 'null')
    if (company?.id) {
      config.headers['X-Company-ID'] = company.id
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)

    return config
  }

  /**
   * Request error handler
   */
  private handleRequestError(error: AxiosError) {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }

  /**
   * Response interceptor - validate and log responses
   */
  private async handleResponse(response: AxiosResponse) {
    console.log(`[API Response] ${response.status} ${response.config.url}`)

    // Log successful API calls
    const user = JSON.parse(localStorage.getItem('pspm_user') || 'null')
    const company = JSON.parse(localStorage.getItem('pspm_company') || 'null')
    
    if (user && company) {
      auditLogger.log(
        user.id,
        user.email,
        company.id,
        'OTHER',
        'api',
        `API call: ${response.config.method?.toUpperCase()} ${response.config.url}`,
        'success',
        undefined,
        undefined,
        { status: response.status }
      )
    }

    return response
  }

  /**
   * Response error handler - centralized error handling
   */
  private async handleResponseError(error: AxiosError<ApiErrorResponse>) {
    const user = JSON.parse(localStorage.getItem('pspm_user') || 'null')
    const company = JSON.parse(localStorage.getItem('pspm_company') || 'null')

    // Log error API calls
    if (user && company) {
      auditLogger.log(
        user.id,
        user.email,
        company.id,
        'ERROR',
        'api',
        `API error: ${error.message}`,
        'failed',
        undefined,
        undefined,
        {
          status: error.response?.status,
          code: error.code,
        }
      )
    }

    // Handle specific error codes
    if (error.response?.status === 401) {
      console.error('Unauthorized - clearing auth')
      localStorage.removeItem('pspm_user')
      localStorage.removeItem('pspm_company')
      window.location.href = '/login'
    }

    if (error.response?.status === 403) {
      console.error('Forbidden - insufficient permissions')
    }

    if (error.response?.status === 404) {
      console.error('Resource not found')
    }

    if (error.response?.status === 500) {
      console.error('Server error')
    }

    return Promise.reject(error)
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config)
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config)
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put<T>(url, data, config)
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: any
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch<T>(url, data, config)
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete<T>(url, config)
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    return this.axiosInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * Get axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance
  }
}

// Singleton instance
export const apiService = new ApiService()
