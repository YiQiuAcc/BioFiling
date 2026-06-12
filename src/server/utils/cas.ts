import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import logger from './logger'

/* eslint-disable */
// 使用环境变量配置 CAS 地址
const CAS_SERVER_URL =
  process.env.CAS_SERVER_URL || 'https://cas.example.edu.cn/authserver'
const CAS_VALIDATE_PATH = '/serviceValidate'

interface CasValidationResult {
  valid: boolean
  user?: string
  attributes?: Record<string, any> // 扩展属性 (姓名、手机号等)
  message?: string
}

/**
 * 向 CAS 服务器验证 Ticket
 * @param ticket 前端传来的 ticket
 * @param service 前端的回调地址 (必须与请求 ticket 时完全一致)
 */
export const validateCasTicket = async (
  ticket: string,
  service: string,
): Promise<CasValidationResult> => {
  try {
    // 构造完整的验证地址
    // https://cas.example.edu.cn/authserver/serviceValidate?ticket=...&service=...
    const validateUrl = `${CAS_SERVER_URL}${CAS_VALIDATE_PATH}`
    logger.info(`[CAS] Validating ticket: ${ticket} for service: ${service}`)
    const response = await axios.get(validateUrl, {
      params: {
        ticket,
        service,
      },
      timeout: 10000, // 设置超时防止请求挂起
    })

    // 解析 CAS 返回的 XML
    const result = await parseStringPromise(response.data)
    // XML 结构通常如下:
    // <cas:serviceResponse>
    //   <cas:authenticationSuccess>
    //     <cas:user>20220222</cas:user>
    //     <cas:attributes>...</cas:attributes>
    //   </cas:authenticationSuccess>
    // </cas:serviceResponse>

    const serviceResponse = result['cas:serviceResponse']
    // await writeFile('./debug.txt', JSON.stringify(serviceResponse, null, 2))
    if (serviceResponse && serviceResponse['cas:authenticationSuccess']) {
      const successData = serviceResponse['cas:authenticationSuccess'][0]
      // 获取工号
      const user = successData['cas:user']?.[0]
      // 解析扩展属性
      const rawAttributes = successData['cas:attributes']?.[0] || {}
      const attributes: Record<string, any> = {}
      // 扁平化属性数组 (xml2js 会把内容变成数组)
      for (const key in rawAttributes) {
        if (Array.isArray(rawAttributes[key])) {
          attributes[key] = rawAttributes[key][0]
        } else {
          attributes[key] = rawAttributes[key]
        }
      }
      return {
        valid: true,
        user,
        attributes,
      }
    } else {
      // 验证失败
      const failureData = serviceResponse?.['cas:authenticationFailure']?.[0]
      const errorMsg = failureData?._ || 'Unknown CAS Error'
      logger.warn('[CAS] Validation failed:', errorMsg)
      return { valid: false, message: errorMsg }
    }
  } catch (error) {
    logger.error('[CAS] Network or Parser Error:', error)
    return { valid: false, message: 'Internal Validation Error' }
  }
}
