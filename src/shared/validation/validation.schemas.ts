import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// === 实验室准入人员信息 Schema (Personnel) ===
export const personnelSchema = z.object({
  key: z.string(),
  department: z.string().min(1, { message: '单位不能为空' }),
  name: z.string().min(1, { message: '姓名不能为空' }),
  id: z.string().min(1, { message: '工号/学号不能为空' }),
  // 中国大陆手机号验证
  phone: z.string().regex(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' }),
  content: z.string().optional().or(z.literal('')),
})

// === 表单主数据 Schema (FormDataState) ===
export const formDataSchema = z
  .object({
    // --- 负责人信息 ---
    leaderName: z.string().min(1, { message: '项目负责人姓名不能为空' }),
    leaderId: z.string().min(1, { message: '负责人工号不能为空' }),
    department: z.string().min(1, { message: '所属部门不能为空' }),
    title: z.string().min(1, { message: '职称不能为空' }),
    phone: z
      .string()
      .regex(/^1[3-9]\d{9}$/, { message: '负责人手机号格式不正确' }),
    email: z.string().email({ message: '邮箱格式不正确' }),

    // --- 项目基本信息 ---
    projectName: z.string().min(1, { message: '项目名称不能为空' }),
    projectSource: z.string().min(1, { message: '项目来源不能为空' }),
    projectType: z.string().min(1, { message: '项目类别不能为空' }),

    // --- 人员统计 ---
    experimenterCount: z
      .number()
      .int()
      .nonnegative({ message: '实验人数必须为非负整数' }),
    personnel: z.array(personnelSchema),

    // --- 实验对象 (根据业务逻辑，如果非必填可改为 .optional()) ---
    animalName: z.string(),
    animalStrain: z.string(),
    animalGrade: z.string(),
    pathogenName: z.string(),
    pathogenType: z.string(),
    pathogenSource: z.string(),

    // --- 安全等级与操作 ---
    bslLevel: z.string().min(1, { message: '请选择生物安全等级' }),
    operationTypes: z
      .array(z.string())
      .min(1, { message: '请至少选择一种操作类型' }),

    // --- 风险标识 (布尔值) ---
    isZoonotic: z.boolean(),
    isHighPathogenic: z.boolean(),
    hasToxicSubstance: z.boolean(),
    toxicSubstanceDesc: z.string(),

    // --- 地点与时间 ---
    locationType: z.enum(['校内', '校外'], {
      errorMap: () => ({ message: '请选择地点类型' }),
    }),
    locationDetail: z.string().min(1, { message: '详细地点不能为空' }),

    // 日期范围通常需要开始和结束两个时间
    dateRange: z
      .array(z.string())
      .length(2, { message: '请选择完整的起止时间' })
      .refine((dates) => dates.every((d) => !!d), {
        message: '起止时间不能为空',
      }),

    // --- 详细描述字段 ---
    facilityMatchDesc: z
      .string()
      .min(1, { message: '设施设备匹配情况不能为空' }),
    workProject: z.string().min(1, { message: '工作项目/内容不能为空' }),
    experimentMethod: z.string().min(1, { message: '实验方法不能为空' }),
    experimentPurpose: z.string().min(1, { message: '实验目的不能为空' }),
    disposalMethod: z.string().min(1, { message: '废弃物处置方式不能为空' }),

    // --- 证明材料 ---
    certifyExplanation: z.string(),
    certifyImagesPath: z.array(z.string()),

    // --- 公开与保密要求信息 ---
    publicInfoType: z.string(),
    publicInfoDesc: z.string(),
  })
  // 添加条件校验逻辑 (superRefine)
  .superRefine((data, ctx) => {
    // 如果勾选了“涉及有毒有害物质”，则描述字段必填
    if (data.hasToxicSubstance && !data.toxicSubstanceDesc.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toxicSubstanceDesc'],
        message: '涉及有毒有害物质时，请填写详细描述',
      })
    }
  })

// === 审核意见 Schema (Opinion) ===
export const opinionSchema = z.object({
  leaderOpinion: z.string(),
  leaderOpinionDate: z.string(),
  unitOpinion: z.string(),
  unitOpinionDate: z.string(),
  numberOfReviewsRemark: z.number().int().nonnegative(),
  filingTime: z.string(),
  filingNumber: z.string(),
})

// === 导出类型推断 ===
export type PersonnelSchemaType = z.infer<typeof personnelSchema>
export type FormDataSchemaType = z.infer<typeof formDataSchema>
export type OpinionSchemaType = z.infer<typeof opinionSchema>

export const personnelSchemaTyped = toTypedSchema(personnelSchema)
export const formDataSchemaTyped = toTypedSchema(formDataSchema)
export const opinionSchemaTyped = toTypedSchema(opinionSchema)
