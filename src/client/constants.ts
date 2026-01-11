// === 常量定义 ===
const TITLE_OPTIONS = [
  '教授',
  '副教授',
  '讲师',
  '实验师',
  '高级实验师',
  '博士后',
  '研究生',
  '其他',
].map((v) => ({ label: v, value: v }))

const PROJECT_TYPES = [
  { label: '教学', value: '教学' },
  { label: '科研', value: '科研' },
  { label: '其他', value: '其他' },
]

const ANIMAL_GRADES = [
  { label: '普通级', value: '普通级' },
  { label: '清洁级', value: '清洁级' },
  { label: 'SPF级', value: 'SPF级' },
  { label: '无菌级', value: '无菌级' },
]

const BSL_LEVELS = [
  { label: 'BSL-1 (ABSL-1)', value: 'BSL-1' },
  { label: 'BSL-2 (ABSL-2)', value: 'BSL-2' },
  { label: 'BSL-3 (ABSL-3)', value: 'BSL-3' },
  { label: 'BSL-4 (ABSL-4)', value: 'BSL-4' },
]

const OPERATION_TYPES = [
  '1.病毒培养',
  '2.活菌操作',
  '3.动物感染实验',
  '4.样本检测',
  '5.未经培养的感染性材料',
  '6.灭活材料',
  '7.非/无感染性材料',
]

export {
  TITLE_OPTIONS,
  PROJECT_TYPES,
  ANIMAL_GRADES,
  BSL_LEVELS,
  OPERATION_TYPES,
}
