export type ChecklistStatus = 'conforme' | 'nao_conforme' | 'nao_aplicavel' | null

export type InspectionStatus = 'aprovado' | 'reprovado' | 'pendente'

export type EquipmentType =
  | 'pemt'
  | 'empilhadeira'
  | 'caminhao_carroceria'
  | 'guindauto'
  | 'manipuladora'
  | 'outros'

export interface ChecklistItem {
  id: string
  numero: number
  descricao: string
  categoria: string
  status: ChecklistStatus
  observacao?: string
  fotos?: string[]
}

export interface InspectionData {
  id?: string
  tipo_equipamento: EquipmentType
  empresa: string
  obra: string
  contrato: string
  data_inspecao: string
  hora_inspecao: string
  tecnico_responsavel: string
  equipamento: string
  tag: string
  modelo: string
  fabricante: string
  placa: string
  ano: string
  subcontratada: string
  observacoes_gerais: string
  horímetro?: string
  trafega_area_externa?: boolean
  itens: ChecklistItem[]
  status: InspectionStatus
  assinatura_inspetor?: string
  nome_inspetor?: string
  assinatura_responsavel?: string
  nome_responsavel?: string
  equipamento_liberado?: boolean
  validade_credencial?: string
  created_at?: string
  updated_at?: string
  user_id?: string
}

export interface User {
  id: string
  email: string
  nome: string
  cargo: string
  empresa: string
  avatar_url?: string
}

export interface DashboardStats {
  total: number
  aprovados: number
  reprovados: number
  pendentes: number
}
