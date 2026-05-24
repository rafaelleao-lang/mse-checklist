'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { EquipmentType } from '@/types'
import { EQUIPMENT_LABELS } from '@/lib/checklistData'

const EQUIPMENT_OPTIONS: { tipo: EquipmentType; icon: string; desc: string; itens: number }[] = [
  { tipo: 'pemt', icon: '🏗️', desc: 'Plataforma Elevatória Móvel de Trabalho', itens: 26 },
  { tipo: 'empilhadeira', icon: '🚜', desc: 'Empilhadeira industrial / Contrabalancete', itens: 43 },
  { tipo: 'caminhao_carroceria', icon: '🚛', desc: 'Caminhão de carroceria e similares', itens: 38 },
  { tipo: 'guindauto', icon: '🏗️', desc: 'Guindauto / Guindaste / Munck', itens: 54 },
  { tipo: 'manipuladora', icon: '🦾', desc: 'Manipuladora telescópica', itens: 38 },
  { tipo: 'outros', icon: '⚙️', desc: 'Outros equipamentos móveis', itens: 0 },
]

export default function NovaInspecaoPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<EquipmentType | null>(null)

  function handleContinuar() {
    if (!selected) return
    router.push(`/inspecoes/nova/checklist?tipo=${selected}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#003087] flex items-center justify-center">
              <Image src="/logo.png" alt="MSE" width={28} height={28} className="object-contain" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Nova Inspeção</p>
              <p className="text-sm font-bold text-gray-900">Selecionar Equipamento</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Qual equipamento deseja inspecionar?</h1>
          <p className="text-sm text-gray-500 mt-1">Selecione o tipo para carregar o checklist correto</p>
        </motion.div>

        <div className="space-y-3">
          {EQUIPMENT_OPTIONS.map((opt, i) => (
            <motion.div
              key={opt.tipo}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <button
                onClick={() => setSelected(opt.tipo)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-center gap-4 ${
                  selected === opt.tipo
                    ? 'border-[#003087] bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected === opt.tipo ? 'bg-[#003087]/10' : 'bg-gray-100'
                }`}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${selected === opt.tipo ? 'text-[#003087]' : 'text-gray-900'}`}>
                    {EQUIPMENT_LABELS[opt.tipo].split(' - ')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{opt.desc}</p>
                  {opt.itens > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">{opt.itens} itens de verificação</p>
                  )}
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected === opt.tipo ? 'border-[#003087] bg-[#003087]' : 'border-gray-300'
                }`}>
                  {selected === opt.tipo && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Aviso importante */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <p className="text-xs text-amber-700 font-semibold mb-1">⚠️ Este Check List deve ser preenchido pelo Técnico de Segurança do Trabalho antes da vistoria pelo cliente.</p>
          <p className="text-xs text-amber-600">LEGENDA: C (conforme) NC (não conforme) N.A (não se aplica)</p>
        </motion.div>
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-6 left-0 right-0 px-4 max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: selected ? 1 : 0.5, y: 0 }}
          onClick={handleContinuar}
          disabled={!selected}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed"
          style={{ background: selected ? 'linear-gradient(135deg, #003087, #0052cc)' : '#94a3b8' }}
        >
          Continuar
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  )
}
