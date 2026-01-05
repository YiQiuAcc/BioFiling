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
  projectSource: string
  projectType: string
  experimenterCount: number
  personnel: Personnel[]
  animalName: string
  animalStrain: string
  animalGrade: string
  pathogenName: string
  pathogenType: string
  pathogenSource: string
  bslLevel: string
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

interface Opinion {
  leaderOpinion: string
  leaderOpinionDate: string
  unitOpinion: string
  unitOpinionDate: string
  numberOfReviewsRemark: number
  filingTime: string
  filingNumber: string
}

export type { Personnel, FormDataState, Opinion }
