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
    // 可在这里直接解包 response.data
    // 但为保留 headers (用于文件名)，返回完整 response
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

  // 尝试从 Content-Disposition 获取文件名
  let filename = originFilename
  const disposition = headers['content-disposition']
  if (disposition) {
    // 匹配 filename="xxx" 或 filename*=utf-8''xxx
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    const matches = filenameRegex.exec(disposition)
    if (matches != null && matches[1]) {
      filename = decodeURIComponent(
        matches[1].replace(/['"]/g, '').replace("utf-8''", ''),
      )
    }
  }

  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export default http
