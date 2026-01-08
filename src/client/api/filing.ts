import type { ZodIssue } from 'zod'
import http from '@/api/http'
import type {
  ApiResponse,
  FilingDetail,
  FilingRecord,
  FormDataState,
  filingStatus,
} from '@/types'

export const filingAPI = {
  /**
   * 提交表单 (新建)
   * POST /api/filings/submit
   */
  submit: (data: FormDataState) => {
    return http.post<ApiResponse<number | ZodIssue[] | string>>(
      '/filings/submit',
      data,
    )
  },

  /**
   * 更新表单 (用于被驳回后重新提交)
   * PUT /api/filings/:id
   */
  update: (id: number, data: FormDataState) => {
    return http.put<ApiResponse>(`/filings/${id}`, data)
  },

  /**
   * 获取我的提交记录
   * GET /api/filings/my
   */
  getMyRecords: () => http.get<ApiResponse<FilingRecord[]>>('/filings/my'),

  /**
   * 获取所有记录 (管理员)
   * GET /api/filings
   */
  getAllRecords: (params?: { keyword?: string; status?: string }) =>
    http.get<ApiResponse<FilingRecord[]>>('/filings', { params }),
  /**
   * 获取单条记录详情
   * GET /api/filings/:id
   */
  getDetail: (id: number) =>
    http.get<ApiResponse<FilingDetail>>(`/filings/${id}`),

  /**
   * 删除记录
   * DELETE /api/filings/:id
   */
  delete: (recordId: number) =>
    http.delete<ApiResponse>(`/filings/${recordId}`),

  /**
   * 审核记录
   * PATCH /api/filings/:id/audit
   */
  audit: (id: number, status: filingStatus, comment?: string) =>
    http.patch<ApiResponse>(`/filings/${id}/audit`, { status, comment }),

  // === 下载类接口 ===

  /**
   * 下载单个备案生成的文档
   * GET /api/filings/:id/download
   */
  downloadRecord: (id: number) =>
    http.get(`/filings/${id}/download`, {
      responseType: 'blob',
    }),

  /**
   * 导出所有记录 (管理员)
   * GET /api/filings/exports
   */
  exportAll: () =>
    http.get('/filings/exports', {
      responseType: 'blob',
    }),
}
