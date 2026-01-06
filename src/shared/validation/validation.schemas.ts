import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// === 实验室准入人员信息 Schema ===
export const personnelSchema = z.object({
  key: z.string(),
  department: z.string().min(1, { message: '单位不能为空' }),
  name: z.string().min(1, { message: '姓名不能为空' }),
  id: z.string().min(1, { message: '工号/学号不能为空' }),
  phone: z.string().regex(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' }),
  content: z.string().min(1, { message: '实验内容不能为空' }),
})

// === 表单主数据 Schema ===
export const formDataSchema = z
  .object({
    // --- 负责人信息 (SectionBasic) ---
    leaderName: z
      .string({ required_error: '' })
      .min(1, { message: '项目负责人姓名不能为空' }),
    leaderId: z
      .string({ required_error: '' })
      .min(1, { message: '负责人工号不能为空' }),
    department: z
      .string({ required_error: '' })
      .min(1, { message: '所属部门不能为空' }),
    title: z.string({ required_error: '' }).min(1, { message: '职称不能为空' }),
    phone: z
      .string({ required_error: '' })
      .regex(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' }),
    email: z
      .string({ required_error: '' })
      .email({ message: '邮箱格式不正确' }),

    // --- 项目基本信息 (SectionBasic) ---
    projectName: z
      .string({ required_error: '' })
      .min(1, { message: '项目名称不能为空' }),
    projectSource: z
      .string({ required_error: '' })
      .min(1, { message: '项目来源不能为空' }),
    projectType: z
      .string({ required_error: '' })
      .min(1, { message: '项目类别不能为空' }),

    // --- 人员统计 (SectionBasic) ---
    experimenterCount: z
      .number({ required_error: '' })
      .int()
      .min(1, { message: '实验人数至少为1人' }),
    personnel: z
      .array(personnelSchema, { required_error: '' })
      .min(1, { message: '请至少添加一名实验人员' }),

    // --- 实验对象与风险 (SectionRisk) ---
    animalName: z.string().optional(),
    animalStrain: z.string().optional(),
    animalGrade: z.string().optional(),

    pathogenName: z.string().optional(),
    pathogenType: z.string().optional(),
    pathogenSource: z.string().optional(),

    // --- 安全等级与操作 (SectionRisk) ---
    bslLevel: z
      .string({ required_error: '' })
      .min(1, { message: '请选择生物安全等级' }),
    operationTypes: z
      .array(z.string(), { required_error: '' })
      .min(1, { message: '请至少选择一种操作类型' }),

    // --- 风险标识 (SectionRisk) ---
    isZoonotic: z.boolean(),
    isHighPathogenic: z.boolean(),
    hasToxicSubstance: z.boolean(),
    toxicSubstanceDesc: z.string().optional(), // 条件必填

    // --- 地点与时间 (SectionLocation) ---
    locationType: z.enum(['校内', '校外'], {
      required_error: '',
      errorMap: () => ({ message: '请选择地点类型' }),
    }),
    locationDetail: z
      .string({ required_error: '' })
      .min(1, { message: '详细地点不能为空' }),
    dateRange: z
      .array(z.string(), { required_error: '' })
      .length(2, { message: '请选择完整的起止时间' })
      .refine((dates) => dates.every((d) => !!d), {
        message: '起止时间不能为空',
      }),

    // --- 设施与内容 (SectionContent) ---
    workProject: z
      .string({ required_error: '' })
      .min(1, { message: '工作项目/内容不能为空' }),
    experimentMethod: z
      .string({ required_error: '' })
      .min(1, { message: '实验方法不能为空' }),
    experimentPurpose: z
      .string({ required_error: '' })
      .min(1, { message: '实验目的不能为空' }),
    disposalMethod: z
      .string({ required_error: '' })
      .min(1, { message: '废弃物处置方式不能为空' }),
    facilityMatchDesc: z
      .string({ required_error: '' })
      .min(1, { message: '设施设备匹配情况不能为空' }),

    // --- 补充文件 (SectionFiles) ---
    certifyExplanation: z.string(),
    // 必须上传文件
    certifyImagesPath: z
      .array(z.string(), { required_error: '' })
      .min(1, { message: '请上传证明文件' }),

    // --- 公开与保密 (SectionFiles) ---
    publicInfoType: z
      .string({ required_error: '' })
      .min(1, { message: '请选择信息公开设置' }),
    publicInfoDesc: z.string({ required_error: '' }).optional(), // 条件必填
  })
  .superRefine((data, ctx) => {
    // 毒害物质校验
    if (data.hasToxicSubstance && !data.toxicSubstanceDesc?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toxicSubstanceDesc'],
        message: '已勾选涉及有毒物质，请填写详细描述',
      })
    }

    // 信息公开校验
    if (data.publicInfoType === '部分公开' && !data.publicInfoDesc?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publicInfoDesc'],
        message: '选择部分公开时，请说明保密内容',
      })
    }

    // 实验对象逻辑校验 (如果填了动物等级，则必须填动物名称)
    if (data.animalGrade && !data.animalName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['animalName'],
        message: '请填写动物名称',
      })
    }

    // 病原体逻辑 (如果填了微生物种类，必须填名称)
    if (data.pathogenType && !data.pathogenName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pathogenName'],
        message: '请填写病原微生物名称',
      })
    }
  })

export type FormDataSchemaType = z.infer<typeof formDataSchema>
export const formDataSchemaTyped = toTypedSchema(formDataSchema)
