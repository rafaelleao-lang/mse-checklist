'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, XCircle, Camera, ChevronDown, ChevronUp,
  FileText, AlertTriangle, X,
} from 'lucide-react'
import { EquipmentType, ChecklistItem, InspectionData, ChecklistStatus } from '@/types'
import { EQUIPMENT_LABELS, getChecklistTemplate } from '@/lib/checklistData'
import { getUser } from '@/lib/localStorage'
import SignaturePad from 'signature_pad'
import { format } from 'date-fns'

function ChecklistContent() {
  const router = useRouter()
  const params = useSearchParams()
  const tipo = (params.get('tipo') || 'pemt') as EquipmentType

  const [step, setStep] = useState<'dados' | 'checklist' | 'assinatura' | 'resultado'>('dados')
  const [formData, setFormData] = useState({
    empresa: 'MSE Engenharia',
    obra: '',
    contrato: '',
    data_inspecao: format(new Date(), 'dd/MM/yyyy'),
    hora_inspecao: format(new Date(), 'HH:mm'),
    tecnico_responsavel: '',
    equipamento: '',
    tag: '',
    modelo: '',
    fabricante: '',
    placa: '',
    ano: '',
    subcontratada: '',
    observacoes_gerais: '',
    horimetro: '',
  })
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Condições Gerais']))
  const [nomeInspetor, setNomeInspetor] = useState('')
  const [equipamentoLiberado, setEquipamentoLiberado] = useState<boolean | null>(null)
  const sigCanvasRef = useRef<HTMLCanvasElement>(null)
  const sigPadRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    const u = getUser()
    if (u) {
      setFormData(f => ({ ...f, tecnico_responsavel: u.nome, empresa: u.empresa || 'MSE Engenharia' }))
      setNomeInspetor(u.nome)
    }
    setItems(getChecklistTemplate(tipo))
  }, [tipo])

  // Signature pad setup — fix canvas dimensions before initializing
  useEffect(() => {
    if (step !== 'assinatura') {
      if (sigPadRef.current) {
        sigPadRef.current.off()
        sigPadRef.current = null
      }
      return
    }

    const timer = setTimeout(() => {
      const canvas = sigCanvasRef.current
      if (!canvas) return

      // Critical: sync canvas pixel dimensions with its CSS-rendered size
      // Without this, touch events are offset by the scale difference
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      sigPadRef.current = new SignaturePad(canvas, {
        penColor: '#000000',
        backgroundColor: 'rgba(0,0,0,0)',
        minWidth: 1.5,
        maxWidth: 3,
      })
    }, 300)

    return () => {
      clearTimeout(timer)
      if (sigPadRef.current) {
        sigPadRef.current.off()
        sigPadRef.current = null
      }
    }
  }, [step])

  const categories = [...new Set(items.map(i => i.categoria))]
  const categoryCounts = categories.reduce((acc, cat) => {
    const catItems = items.filter(i => i.categoria === cat)
    acc[cat] = {
      total: catItems.length,
      conforme: catItems.filter(i => i.status === 'conforme').length,
      nao_conforme: catItems.filter(i => i.status === 'nao_conforme').length,
      na: catItems.filter(i => i.status === 'nao_aplicavel').length,
    }
    return acc
  }, {} as Record<string, { total: number; conforme: number; nao_conforme: number; na: number }>)

  const totalItems = items.length
  const preenchidos = items.filter(i => i.status !== null).length
  const naoConformes = items.filter(i => i.status === 'nao_conforme').length
  const progresso = totalItems > 0 ? Math.round((preenchidos / totalItems) * 100) : 0
  const statusFinal: 'aprovado' | 'reprovado' | 'pendente' = preenchidos === totalItems
    ? (naoConformes === 0 ? 'aprovado' : 'reprovado')
    : 'pendente'

  function handleItemStatus(id: string, status: ChecklistStatus) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item))
  }

  function handleItemObs(id: string, obs: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, observacao: obs } : item))
  }

  function handlePhotoCapture(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, fotos: [...(item.fotos || []), url] } : item
      ))
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto(id: string, photoIndex: number) {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, fotos: item.fotos?.filter((_, i) => i !== photoIndex) }
        : item
    ))
  }

  function toggleCategory(cat: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function handleFinalizar() {
    const sig1 = sigPadRef.current?.isEmpty() ? '' : (sigPadRef.current?.toDataURL() || '')

    const inspection: InspectionData = {
      tipo_equipamento: tipo,
      ...formData,
      itens: items,
      status: statusFinal,
      assinatura_inspetor: sig1,
      nome_inspetor: nomeInspetor,
      assinatura_responsavel: '',
      nome_responsavel: '',
      equipamento_liberado: equipamentoLiberado ?? (naoConformes === 0),
    }

    // Tenta salvar com tudo (incluindo fotos), depois sem fotos se exceder quota
    try {
      sessionStorage.setItem('mse_current_inspection', JSON.stringify(inspection))
    } catch {
      try {
        const semFotos = {
          ...inspection,
          itens: inspection.itens.map(item => ({ ...item, fotos: [] })),
        }
        sessionStorage.setItem('mse_current_inspection', JSON.stringify(semFotos))
      } catch {
        // Último recurso: sem fotos e sem assinatura
        const minimal = {
          ...inspection,
          itens: inspection.itens.map(item => ({ ...item, fotos: [] })),
          assinatura_inspetor: '',
        }
        sessionStorage.setItem('mse_current_inspection', JSON.stringify(minimal))
      }
    }

    setStep('resultado')
  }

  function handleUpdate(field: string, value: string) {
    setFormData(f => ({ ...f, [field]: value }))
  }

  // ── STEP: DADOS ──────────────────────────────────────────────────────────────
  if (step === 'dados') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Dados do Equipamento" subtitle={EQUIPMENT_LABELS[tipo]} onBack={() => router.back()} />
        <div className="max-w-2xl mx-auto px-4 py-4 pb-28">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">
            <SectionTitle icon="📋" title="Dados da Inspeção" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Data" value={formData.data_inspecao} onChange={v => handleUpdate('data_inspecao', v)} placeholder="dd/mm/aaaa" />
              <InputField label="Hora" value={formData.hora_inspecao} onChange={v => handleUpdate('hora_inspecao', v)} placeholder="HH:mm" />
            </div>
            <InputField label="Técnico Responsável *" value={formData.tecnico_responsavel} onChange={v => handleUpdate('tecnico_responsavel', v)} placeholder="Nome completo" />
            <InputField label="Empresa *" value={formData.empresa} onChange={v => handleUpdate('empresa', v)} placeholder="Empresa contratante" />
            <InputField label="Obra / Local *" value={formData.obra} onChange={v => handleUpdate('obra', v)} placeholder="Nome da obra ou local" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Contrato" value={formData.contrato} onChange={v => handleUpdate('contrato', v)} placeholder="Nº contrato" />
              <InputField label="Subcontratada" value={formData.subcontratada} onChange={v => handleUpdate('subcontratada', v)} placeholder="Nome" />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <SectionTitle icon="⚙️" title="Dados do Equipamento" />
            </div>
            <InputField label="Equipamento / Descrição *" value={formData.equipamento} onChange={v => handleUpdate('equipamento', v)} placeholder={`Ex: ${EQUIPMENT_LABELS[tipo].split(' - ')[0]}`} />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="TAG / Identificação" value={formData.tag} onChange={v => handleUpdate('tag', v)} placeholder="Ex: EMP-001" />
              <InputField label="Placa / Série" value={formData.placa} onChange={v => handleUpdate('placa', v)} placeholder="Placa ou Nº série" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Modelo" value={formData.modelo} onChange={v => handleUpdate('modelo', v)} placeholder="Modelo" />
              <InputField label="Fabricante" value={formData.fabricante} onChange={v => handleUpdate('fabricante', v)} placeholder="Fabricante" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Ano" value={formData.ano} onChange={v => handleUpdate('ano', v)} placeholder="Ano" />
              <InputField label="Horímetro" value={formData.horimetro} onChange={v => handleUpdate('horimetro', v)} placeholder="Horas" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Observações Gerais</label>
              <textarea
                value={formData.observacoes_gerais}
                onChange={e => handleUpdate('observacoes_gerais', e.target.value)}
                placeholder="Observações iniciais..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] resize-none"
              />
            </div>
          </div>
        </div>
        <BottomButton
          label="Iniciar Checklist"
          onClick={() => setStep('checklist')}
          disabled={!formData.tecnico_responsavel || !formData.obra || !formData.equipamento}
        />
      </div>
    )
  }

  // ── STEP: CHECKLIST ──────────────────────────────────────────────────────────
  if (step === 'checklist') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          title={`Checklist — ${progresso}%`}
          subtitle={`${preenchidos}/${totalItems} itens • ${naoConformes > 0 ? `${naoConformes} não conforme(s)` : 'Sem pendências'}`}
          onBack={() => setStep('dados')}
        >
          <div className="mx-4 mb-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progresso}%`,
                  background: naoConformes > 0 ? '#ef4444' : '#10b981',
                }}
                animate={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </Header>

        <div className="max-w-2xl mx-auto px-4 py-3 pb-28">
          <div className="bg-[#003087] rounded-2xl p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">{formData.equipamento}</p>
              <p className="text-blue-200 text-[10px]">{formData.tag && `TAG: ${formData.tag} • `}{formData.obra}</p>
            </div>
            {naoConformes > 0 && (
              <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded-lg">
                <AlertTriangle className="w-3 h-3 text-white" />
                <span className="text-white text-xs font-bold">{naoConformes} NC</span>
              </div>
            )}
          </div>

          {categories.map(cat => {
            const catItems = items.filter(i => i.categoria === cat)
            const counts = categoryCounts[cat]
            const expanded = expandedCategories.has(cat)

            return (
              <div key={cat} className="mb-3">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: cat === 'Documentação' ? '#fef3c7' : '#eff6ff' }}>
                      {cat === 'Documentação' ? '📄' : '🔧'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">{cat}</p>
                      <p className="text-[10px] text-gray-500">
                        {counts.conforme}✓ {counts.nao_conforme > 0 && `${counts.nao_conforme}✗ `}{counts.na > 0 && `${counts.na}—`} de {counts.total}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {counts.nao_conforme > 0 && (
                      <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        {counts.nao_conforme}
                      </span>
                    )}
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 divide-y divide-gray-100">
                        {catItems.map((item) => (
                          <ChecklistItemRow
                            key={item.id}
                            item={item}
                            onStatus={handleItemStatus}
                            onObs={handleItemObs}
                            onPhoto={handlePhotoCapture}
                            onRemovePhoto={handleRemovePhoto}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          <div className="bg-white rounded-2xl p-4 border border-gray-200 mt-2">
            <p className="text-xs font-bold text-gray-600 mb-2">Resumo da Inspeção</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 rounded-xl p-2">
                <p className="text-lg font-bold text-emerald-600">{items.filter(i => i.status === 'conforme').length}</p>
                <p className="text-[10px] text-emerald-600 font-medium">Conformes</p>
              </div>
              <div className="bg-red-50 rounded-xl p-2">
                <p className="text-lg font-bold text-red-500">{naoConformes}</p>
                <p className="text-[10px] text-red-500 font-medium">Não Conformes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <p className="text-lg font-bold text-gray-500">{items.filter(i => i.status === 'nao_aplicavel').length}</p>
                <p className="text-[10px] text-gray-500 font-medium">N/A</p>
              </div>
            </div>
          </div>
        </div>

        <BottomButton
          label="Ir para Assinatura"
          onClick={() => setStep('assinatura')}
          disabled={preenchidos < totalItems}
          subtitle={preenchidos < totalItems ? `${totalItems - preenchidos} itens sem resposta` : undefined}
        />
      </div>
    )
  }

  // ── STEP: ASSINATURA ─────────────────────────────────────────────────────────
  if (step === 'assinatura') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Assinatura" subtitle="Responsável pela Inspeção" onBack={() => setStep('checklist')} />
        <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-4">

          {/* Status Preview */}
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${naoConformes === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${naoConformes === 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {naoConformes === 0
                ? <CheckCircle2 className="w-6 h-6 text-white" />
                : <XCircle className="w-6 h-6 text-white" />
              }
            </div>
            <div>
              <p className={`font-bold text-base ${naoConformes === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {naoConformes === 0 ? 'EQUIPAMENTO APROVADO' : 'EQUIPAMENTO REPROVADO'}
              </p>
              <p className={`text-xs ${naoConformes === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {naoConformes === 0 ? 'Todos os itens conformes' : `${naoConformes} item(ns) não conforme(s)`}
              </p>
            </div>
          </div>

          {/* Assinatura Inspetor */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Responsável pela Inspeção</p>
            <p className="text-xs text-gray-500 mb-3">Assine com o dedo na área abaixo</p>
            <InputField label="Nome do Inspetor" value={nomeInspetor} onChange={setNomeInspetor} placeholder="Nome completo" />
            <div className="mt-3">
              <div
                className="relative border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50"
                style={{ height: 160 }}
              >
                <canvas
                  ref={sigCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    touchAction: 'none',
                    borderRadius: '14px',
                  }}
                />
                <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none select-none">
                  ✍️ Assine aqui com o dedo
                </p>
              </div>
              <button
                onClick={() => {
                  sigPadRef.current?.clear()
                }}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Limpar assinatura
              </button>
            </div>
          </div>

          {/* Equipamento liberado */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-3">Equipamento Liberado?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setEquipamentoLiberado(true)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${equipamentoLiberado === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-gray-600'}`}
              >
                ✓ SIM
              </button>
              <button
                onClick={() => setEquipamentoLiberado(false)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${equipamentoLiberado === false ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 text-gray-600'}`}
              >
                ✗ NÃO
              </button>
            </div>
          </div>
        </div>

        <BottomButton
          label="Finalizar e Ver Resultado"
          onClick={handleFinalizar}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>
    )
  }

  // ── STEP: RESULTADO ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: naoConformes === 0 ? 'linear-gradient(135deg, #064e3b, #10b981)' : 'linear-gradient(135deg, #7f1d1d, #ef4444)' }}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6"
        >
          {naoConformes === 0
            ? <CheckCircle2 className="w-14 h-14 text-white" />
            : <XCircle className="w-14 h-14 text-white" />
          }
        </motion.div>
        <h1 className="text-3xl font-black text-white mb-2">
          {naoConformes === 0 ? 'APROVADO' : 'REPROVADO'}
        </h1>
        <p className="text-white/80 mb-1">{formData.equipamento}</p>
        <p className="text-white/60 text-sm">{formData.obra} • {formData.data_inspecao}</p>

        {naoConformes > 0 && (
          <div className="mt-4 bg-white/20 rounded-2xl px-4 py-2">
            <p className="text-white text-sm font-semibold">{naoConformes} item(ns) não conforme(s)</p>
          </div>
        )}
      </motion.div>

      <div className="mt-10 w-full max-w-sm space-y-3">
        <button
          onClick={() => router.push('/inspecoes/current/pdf')}
          className="w-full py-4 bg-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
          style={{ color: naoConformes === 0 ? '#064e3b' : '#7f1d1d' }}
        >
          <FileText className="w-5 h-5" />
          Gerar PDF
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 bg-white/20 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  )
}

// ── CHECKLIST ITEM ROW ────────────────────────────────────────────────────────
function ChecklistItemRow({
  item, onStatus, onObs, onPhoto, onRemovePhoto
}: {
  item: ChecklistItem
  onStatus: (id: string, s: ChecklistStatus) => void
  onObs: (id: string, obs: string) => void
  onPhoto: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (id: string, idx: number) => void
}) {
  const [showObs, setShowObs] = useState(false)

  const bgClass = item.status === 'conforme'
    ? 'bg-emerald-50/50'
    : item.status === 'nao_conforme'
    ? 'bg-red-50/50'
    : ''

  return (
    <div className={`px-4 py-3 transition-colors ${bgClass}`}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 mt-0.5">
          {item.numero}
        </span>
        <p className="flex-1 text-sm text-gray-800 leading-snug pr-1">{item.descricao}</p>
      </div>

      {/* Status buttons */}
      <div className="flex items-center gap-2 mt-2.5 ml-9">
        <StatusButton
          active={item.status === 'conforme'}
          color="#10b981"
          activeBg="#d1fae5"
          label="C"
          title="Conforme"
          onClick={() => onStatus(item.id, item.status === 'conforme' ? null : 'conforme')}
        />
        <StatusButton
          active={item.status === 'nao_conforme'}
          color="#ef4444"
          activeBg="#fee2e2"
          label="NC"
          title="Não Conforme"
          onClick={() => onStatus(item.id, item.status === 'nao_conforme' ? null : 'nao_conforme')}
        />
        <StatusButton
          active={item.status === 'nao_aplicavel'}
          color="#6b7280"
          activeBg="#f3f4f6"
          label="N/A"
          title="Não Aplicável"
          onClick={() => onStatus(item.id, item.status === 'nao_aplicavel' ? null : 'nao_aplicavel')}
        />

        <div className="flex-1" />

        {/* Photo button */}
        <label className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors bg-gray-100 hover:bg-blue-100 hover:text-blue-600">
          <Camera className="w-4 h-4 text-gray-500" />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => onPhoto(item.id, e)}
          />
        </label>

        {/* Obs button */}
        <button
          onClick={() => setShowObs(!showObs)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${showObs || item.observacao ? 'bg-[#003087]/10 text-[#003087]' : 'bg-gray-100 text-gray-500'}`}
        >
          ···
        </button>
      </div>

      {/* Photos */}
      {item.fotos && item.fotos.length > 0 && (
        <div className="flex gap-3 mt-3 ml-9 overflow-x-auto pb-1">
          {item.fotos.map((f, i) => (
            <div key={i} className="relative flex-shrink-0">
              <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                <img src={f} alt="" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => onRemovePhoto(item.id, i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Observation */}
      <AnimatePresence>
        {showObs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-9 mt-2"
          >
            <textarea
              value={item.observacao || ''}
              onChange={e => onObs(item.id, e.target.value)}
              placeholder="Observação sobre este item..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#003087]/20 resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── STATUS BUTTON ─────────────────────────────────────────────────────────────
function StatusButton({ active, color, activeBg, label, title, onClick }: {
  active: boolean; color: string; activeBg: string; label: string; title: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all active:scale-95"
      style={{
        borderColor: active ? color : '#e5e7eb',
        background: active ? activeBg : '#f9fafb',
        color: active ? color : '#9ca3af',
      }}
    >
      {label}
    </button>
  )
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Header({ title, subtitle, onBack, children }: {
  title: string; subtitle?: string; onBack: () => void; children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
          {subtitle && <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>}
        </div>
        <Image src="/logo.png" alt="MSE" width={44} height={28} className="object-contain flex-shrink-0" />
      </div>
      {children}
    </header>
  )
}

function InputField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] transition-all"
      />
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span>{icon}</span>
      <p className="text-sm font-bold text-gray-700">{title}</p>
    </div>
  )
}

function BottomButton({ label, onClick, disabled, subtitle, icon }: {
  label: string; onClick: () => void; disabled?: boolean; subtitle?: string; icon?: React.ReactNode
}) {
  return (
    <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
      <div className="max-w-2xl mx-auto">
        {subtitle && (
          <p className="text-center text-xs text-gray-500 mb-2">{subtitle}</p>
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: disabled ? '#94a3b8' : 'linear-gradient(135deg, #003087, #0052cc)' }}
        >
          {icon}
          {label}
        </button>
      </div>
    </div>
  )
}

export default function ChecklistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChecklistContent />
    </Suspense>
  )
}
