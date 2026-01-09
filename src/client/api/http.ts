import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

// === 配置常量 ===
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// === Axios 实例 ===
const http = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// === 请求拦截器 ===
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// === 响应拦截器 ===
http.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config.responseType === 'blob') {
      return response
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
      // 可引入 router 进行跳转
    }
    return Promise.reject(error)
  },
)

/**
 * 通用下载处理工具函数
 * 用于处理后端返回的 Blob 流（Word 或 Zip）
 */
export const downloadBlob = (
  response: AxiosResponse<Blob>,
  originFilename: string = '下载文件',
) => {
  const { data, headers } = response
  if (!headers) {
    console.warn('响应头为空，使用默认文件名')
    return downloadWithDefaultName(data, originFilename)
  }
  // 尝试从 Content-Disposition 获取文件名
  let filename = originFilename

  const disposition =
    headers['content-disposition'] || headers['Content-Disposition']

  if (disposition) {
    // 优先匹配 filename*=utf-8''
    const utf8Match = disposition.match(/filename\*=utf-8''([^;]+)/i)
    if (utf8Match?.[1]) {
      filename = decodeURIComponent(utf8Match[1])
    } else {
      // 匹配 filename="xxx"
      const quotedMatch = disposition.match(/filename="([^"]+)"/i)
      if (quotedMatch?.[1]) {
        filename = decodeURIComponent(quotedMatch[1])
      }
    }
  }

  // 下载文件
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()

  // 延迟清理
  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, 100)
}

// 使用默认文件名的辅助函数
const downloadWithDefaultName = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, 100)
}

export default http
