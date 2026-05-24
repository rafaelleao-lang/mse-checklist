import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          cargo: string
          empresa: string
          avatar_url: string | null
          created_at: string
        }
      }
      inspections: {
        Row: {
          id: string
          user_id: string
          tipo_equipamento: string
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
          status: string
          assinatura_inspetor: string | null
          nome_inspetor: string | null
          assinatura_responsavel: string | null
          nome_responsavel: string | null
          equipamento_liberado: boolean | null
          itens: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
