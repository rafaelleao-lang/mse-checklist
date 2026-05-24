'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft, FileText, Trash2, CheckCircle2, XCircle, Clock,
  Building2, User, Calendar, Tag, ChevronDown, ChevronUp, Copy
} from 'lucide-react'
import { getInspectionById, deleteInspection, saveInspection } from '@/lib/localStorage'
import { InspectionData } from '@/types'
import { EQUIPMENT_LABELS } from '@/lib/checklistData'

export default function InspectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['Condições Gerais']))
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    const data = getInspectionById(id)
    if (!data) { router.replace('/dashboard'); return }
    setInspection(data)
  }, [id, router])

  if (!inspection) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const naoConformes = inspection.itens.filter(i => i.status === 'nao_conforme')
  const conformes = inspection.itens.filter(i => i.status === 'conforme')
  const categories = [...new Set(inspection.itens.map(i => i.categoria))]

  const STATUS_MAP = {
    aprovado: { label: 'APROVADO', color: '#10b981', bg: '#d1fae5', Icon: CheckCircle2 },
    reprovado: { label: 'REPROVADO', color: '#ef4444', bg: '#fee2e2', Icon: XCircle },
    pendente: { label: 'PENDENTE', color: '#f59e0b', bg: '#fef3c7', Icon: Clock },
  }
  const sc = STATUS_MAP[inspection.status]

  function handleDelete() {
    deleteInspection(id)
    router.push('/dashboard')
  }

  function handleDuplicate() {
    if (!inspection) return
    const copy = {
      ...inspection,
      id: undefined,
      data_inspecao: new Date().toLocaleDateString('pt-BR'),
      hora_inspecao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      itens: inspection.itens.map(i => ({ ...i, status: null as null, observacao: '', fotos: [] })),
      status: 'pendente' as const,
      assinatura_inspetor: '',
      assinatura_responsavel: '',
    }
    const newId = saveInspection(copy)
    router.push(`/inspecoes/${newId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">{inspection.equipamento}</p>
            <p className="text-xs text-gray-500">{inspection.data_inspecao} • {inspection.hora_inspecao}</p>
          </div>
          <Image src="/logo.png" alt="MSE" width={32} height={32} className="rounded-xl object-contain" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 mb-4 flex items-center gap-4"
          style={{ background: sc.bg }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: sc.color }}>
            <sc.Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xl font-black" style={{ color: sc.color }}>{sc.label}</p>
            <p className="text-sm" style={{ color: sc.color }}>
              {conformes.length} conformes • {naoConformes.length} não conformes
            </p>
          </div>
        </motion.div>

        {/* Info Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Dados da Inspeção</p>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Obra" value={inspection.obra} />
            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Técnico" value={inspection.tecnico_responsavel} />
            <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Data" value={`${inspection.data_inspecao} ${inspection.hora_inspecao}`} />
            <InfoRow icon={<Tag className="w-3.5 h-3.5" />} label="TAG" value={inspection.tag || '—'} />
          </div>
          <div className="border-t border-gray-100 pt-3 mt-3 grid grid-cols-2 gap-3">
            <InfoRow label="Modelo" value={inspection.modelo || '—'} />
            <InfoRow label="Placa" value={inspection.placa || '—'} />
            <InfoRow label="Fabricante" value={inspection.fabricante || '—'} />
            <InfoRow label="Ano" value={inspection.ano || '—'} />
          </div>
          {inspection.observacoes_gerais && (
            <div className="border-t border-gray-100 pt-3 mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Observações</p>
              <p className="text-sm text-gray-700">{inspection.observacoes_gerais}</p>
            </div>
          )}
        </div>

        {/* Non-conformities highlight */}
        {naoConformes.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Itens Não Conformes ({naoConformes.length})
            </p>
            <div className="space-y-2">
              {naoConformes.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-3 border border-red-100">
                  <p className="text-xs text-red-800 font-medium">{item.numero}. {item.descricao}</p>
                  {item.observacao && <p className="text-xs text-red-600 mt-1">→ {item.observacao}</p>}
                  {item.fotos && item.fotos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {item.fotos.map((f, i) => (
                        <img key={i} src={f} className="w-12 h-12 rounded-lg object-cover border border-red-200" alt="" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All items by category */}
        {categories.map(cat => {
          const catItems = inspection.itens.filter(i => i.categoria === cat)
          const expanded = expandedCats.has(cat)
          return (
            <div key={cat} className="mb-3">
              <button
                onClick={() => {
                  const next = new Set(expandedCats)
                  next.has(cat) ? next.delete(cat) : next.add(cat)
                  setExpandedCats(next)
                }}
                className="w-full bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{cat}</p>
                  <p className="text-[10px] text-gray-500">
                    {catItems.filter(i => i.status === 'conforme').length}C •{' '}
                    {catItems.filter(i => i.status === 'nao_conforme').length}NC •{' '}
                    {catItems.filter(i => i.status === 'nao_aplicavel').length}NA
                  </p>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {expanded && (
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-2xl divide-y divide-gray-100">
                  {catItems.map(item => {
                    const color = item.status === 'conforme' ? '#10b981' : item.status === 'nao_conforme' ? '#ef4444' : '#9ca3af'
                    const label = item.status === 'conforme' ? 'C' : item.status === 'nao_conforme' ? 'NC' : item.status === 'nao_aplicavel' ? 'N/A' : '—'
                    return (
                      <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                        <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">
                          {item.numero}
                        </span>
                        <p className="flex-1 text-sm text-gray-700 leading-snug">{item.descricao}</p>
                        <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ color, background: `${color}20` }}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Signatures */}
        {(inspection.assinatura_inspetor || inspection.assinatura_responsavel) && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-4">
            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Assinaturas</p>
            <div className="grid grid-cols-2 gap-4">
              {inspection.assinatura_inspetor && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Inspetor</p>
                  <div className="bg-gray-50 rounded-xl p-2 h-16 flex items-center justify-center border border-gray-200">
                    <img src={inspection.assinatura_inspetor} alt="Assinatura inspetor" className="max-h-full" />
                  </div>
                  <p className="text-xs text-gray-700 font-medium mt-1 text-center">{inspection.nome_inspetor}</p>
                </div>
              )}
              {inspection.assinatura_responsavel && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Responsável</p>
                  <div className="bg-gray-50 rounded-xl p-2 h-16 flex items-center justify-center border border-gray-200">
                    <img src={inspection.assinatura_responsavel} alt="Assinatura responsável" className="max-h-full" />
                  </div>
                  <p className="text-xs text-gray-700 font-medium mt-1 text-center">{inspection.nome_responsavel}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setShowDelete(true)}
            className="w-10 h-12 flex items-center justify-center rounded-2xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDuplicate}
            className="flex-1 h-12 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Duplicar
          </button>
          <button
            onClick={() => router.push(`/inspecoes/${id}/pdf`)}
            className="flex-1 h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #003087, #0052cc)' }}
          >
            <FileText className="w-4 h-4" />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Excluir inspeção?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
  )
}
