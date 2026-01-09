// === 类型定义 ===
// 实验室准入人员
interface Personnel {
  key: string
  department: string
  name: string
  id: string
  phone: string
  content: string
}

interface FormDataState {
  leaderName: string
  leaderId: string
  department: string
  title: string
  phone: string
  email: string
  projectName: string
  projectCode: string
  projectSource: string
  projectType: '教学' | '科研' | '其他'
  experimenterCount: number
  personnel: Personnel[]
  animalName: string
  animalStrain: string
  animalGrade: string
  pathogenName: string
  pathogenType: '动物' | '植物' | '微生物' | '其他'
  pathogenSource: string
  bslLevel: 'BSL-1' | 'BSL-2' | 'BSL-3' | 'BSL-4'
  operationTypes: string[]
  isZoonotic: boolean
  isHighPathogenic: boolean
  hasToxicSubstance: boolean
  toxicSubstanceDesc: string
  locationType: '校内' | '校外'
  locationDetail: string
  dateRange: string[]
  facilityMatchDesc: string
  workProject: string
  experimentMethod: string
  experimentPurpose: string
  disposalMethod: string
  certifyExplanation: string
  certifyImagesPath: string[]
  publicInfoType: string
  publicInfoDesc: string
}

export type { Personnel, FormDataState }
