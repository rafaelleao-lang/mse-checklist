'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Loader2, CheckCircle2 } from 'lucide-react'
import { getInspectionById } from '@/lib/localStorage'
import { InspectionData } from '@/types'
import { EQUIPMENT_LABELS } from '@/lib/checklistData'

export default function PDFPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [inspection, setInspection] = useState<InspectionData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id === 'current') {
      const raw = typeof window !== 'undefined'
        ? sessionStorage.getItem('mse_current_inspection')
        : null
      if (!raw) { router.replace('/dashboard'); return }
      setInspection(JSON.parse(raw))
    } else {
      const data = getInspectionById(id)
      if (!data) { router.replace('/dashboard'); return }
      setInspection(data)
    }
  }, [id, router])

  async function generatePDF() {
    if (!inspection || !previewRef.current) return
    setGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      const SCALE = 2
      const RENDER_W = 794  // A4 at 96 dpi

      // ── 1. Clone the preview into a fixed-width off-screen container ──────
      const clone = previewRef.current.cloneNode(true) as HTMLElement
      const wrapper = document.createElement('div')
      wrapper.style.cssText =
        'position:fixed;top:0;left:-3000px;width:794px;background:white;z-index:-1;'
      clone.style.width = `${RENDER_W}px`
      clone.style.minHeight = 'auto'
      clone.style.margin = '0'
      clone.style.boxShadow = 'none'
      clone.style.padding = '0'
      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      // Let layout settle before measuring / capturing
      await new Promise(r => setTimeout(r, 150))

      // ── 2. Record where each section ends (in canvas pixels) ─────────────
      const sections = Array.from(
        clone.querySelectorAll('[data-pdf-section]')
      ) as HTMLElement[]
      const wrapperTop = wrapper.getBoundingClientRect().top
      const sectionEnds = sections.map(s => {
        const r = s.getBoundingClientRect()
        return Math.round((r.bottom - wrapperTop) * SCALE)
      })

      // ── 3. Render to canvas ───────────────────────────────────────────────
      const canvas = await html2canvas(clone, {
        scale: SCALE,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: RENDER_W,
        height: Math.ceil(clone.scrollHeight),
      })
      document.body.removeChild(wrapper)

      // ── 4. Smart page splits at section boundaries ───────────────────────
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const PAGE_W_MM = pdf.internal.pageSize.getWidth()   // 210
      const PAGE_H_MM = pdf.internal.pageSize.getHeight()  // 297
      const PAGE_H_PX = Math.round((PAGE_H_MM / PAGE_W_MM) * canvas.width)

      let pageStart = 0
      let pageNum = 0

      while (pageStart < canvas.height) {
        const idealEnd = pageStart + PAGE_H_PX

        // Find the last section end that falls before the ideal cut point
        let cutAt = Math.min(idealEnd, canvas.height)
        for (const end of sectionEnds) {
          if (end > pageStart + 40 && end <= idealEnd) cutAt = end
        }
        cutAt = Math.min(cutAt, canvas.height)

        // Crop this page slice from the full canvas
        const sliceH = cutAt - pageStart
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceH
        sliceCanvas.getContext('2d')!.drawImage(canvas, 0, -pageStart)

        const sliceHmm = (sliceH / canvas.width) * PAGE_W_MM
        if (pageNum > 0) pdf.addPage()
        pdf.addImage(
          sliceCanvas.toDataURL('image/jpeg', 0.92),
          'JPEG', 0, 0, PAGE_W_MM, sliceHmm
        )

        pageStart = cutAt
        pageNum++
      }

      const tag = (inspection.tag || inspection.placa || 'SN').replace(/\s/g, '_')
      const dt = inspection.data_inspecao.replace(/\//g, '-')
      pdf.save(`MSE_CheckList_${inspection.tipo_equipamento.toUpperCase()}_${tag}_${dt}.pdf`)
      setGenerated(true)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
      alert('Erro ao gerar o PDF. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  if (!inspection) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const categories = [...new Set(inspection.itens.map(i => i.categoria))]
  const naoConformes = inspection.itens.filter(i => i.status === 'nao_conforme')
  const conformes  = inspection.itens.filter(i => i.status === 'conforme')
  const naItems    = inspection.itens.filter(i => i.status === 'nao_aplicavel')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="flex-1 text-sm font-bold text-gray-900">Visualização do Relatório</p>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #003087, #0052cc)' }}
          >
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
              : <><Download className="w-4 h-4" /> Gerar PDF</>}
          </button>
        </div>
      </header>

      {generated && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 pt-3"
        >
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-sm text-emerald-700 font-medium">PDF gerado com sucesso!</p>
          </div>
        </motion.div>
      )}

      {/* Scrollable preview — PDF content */}
      <div className="max-w-4xl mx-auto px-2 py-4 pb-28 overflow-x-auto">
        {/* previewRef is what we clone for PDF generation */}
        <div
          ref={previewRef}
          className="bg-white shadow-xl"
          style={{
            width: '794px',   // A4 at 96 dpi — consistent on all devices
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
          }}
        >
          {/* ── HEADER ──────────────────────────────────────────────────── */}
          <div
            data-pdf-section
            style={{ background: '#003087', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'white', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="MSE" style={{ height: '36px', width: 'auto', display: 'block' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>MSE Engenharia</p>
                <p style={{ color: '#93c5fd', fontSize: '9px', margin: 0 }}>Sistema de Gestão em Segurança do Trabalho</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'white', fontWeight: 'bold', fontSize: '12px', margin: 0 }}>CHECK LIST DE INSPEÇÃO</p>
              <p style={{ color: '#93c5fd', fontSize: '9px', margin: 0 }}>{EQUIPMENT_LABELS[inspection.tipo_equipamento]}</p>
            </div>
          </div>

          {/* ── STATUS BANNER ───────────────────────────────────────────── */}
          <div
            data-pdf-section
            style={{
              background: inspection.status === 'aprovado' ? '#d1fae5' : inspection.status === 'reprovado' ? '#fee2e2' : '#fef3c7',
              borderBottom: `3px solid ${inspection.status === 'aprovado' ? '#10b981' : inspection.status === 'reprovado' ? '#ef4444' : '#f59e0b'}`,
              padding: '8px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{
              fontSize: '18px', fontWeight: 'bold',
              color: inspection.status === 'aprovado' ? '#065f46' : inspection.status === 'reprovado' ? '#7f1d1d' : '#78350f',
            }}>
              EQUIPAMENTO {inspection.status === 'aprovado' ? '✓ APROVADO' : inspection.status === 'reprovado' ? '✗ REPROVADO' : '⏳ PENDENTE'}
            </span>
            <p style={{ fontSize: '9px', color: '#374151', margin: 0 }}>
              {conformes.length} Conformes • {naoConformes.length} Não Conformes • {naItems.length} N/A
            </p>
          </div>

          <div style={{ padding: '12px 16px' }}>
            {/* ── INFO — Mobilização ──────────────────────────────────── */}
            <div data-pdf-section style={{ marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ background: '#1e40af' }}>
                    <td colSpan={4} style={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', fontSize: '10px' }}>
                      DADOS PARA MOBILIZAÇÃO
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#f8fafc' }}>
                    <PDFCell label="Empresa" value={inspection.empresa} />
                    <PDFCell label="Subcontratada" value={inspection.subcontratada || 'N/A'} />
                    <PDFCell label="Data da Inspeção" value={inspection.data_inspecao} />
                    <PDFCell label="Hora" value={inspection.hora_inspecao} />
                  </tr>
                  <tr>
                    <PDFCell label="Obra / Local" value={inspection.obra} colSpan={2} />
                    <PDFCell label="Contrato" value={inspection.contrato || 'N/A'} />
                    <PDFCell label="Técnico Responsável" value={inspection.tecnico_responsavel} />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── INFO — Equipamento ──────────────────────────────────── */}
            <div data-pdf-section style={{ marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ background: '#1e40af' }}>
                    <td colSpan={6} style={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', fontSize: '10px' }}>
                      ACESSÓRIOS — EQUIPAMENTO
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#f8fafc' }}>
                    <PDFCell label="Tipo" value={EQUIPMENT_LABELS[inspection.tipo_equipamento].split(' - ')[0]} />
                    <PDFCell label="TAG / Nº Série" value={inspection.tag || 'N/A'} />
                    <PDFCell label="Placa" value={inspection.placa || 'N/A'} />
                    <PDFCell label="Ano" value={inspection.ano || 'N/A'} />
                    <PDFCell label="Modelo" value={inspection.modelo || 'N/A'} />
                    <PDFCell label="Fabricante" value={inspection.fabricante || 'N/A'} />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── CHECKLIST — one block per category ─────────────────── */}
            {categories.map(cat => {
              const catItems  = inspection.itens.filter(i => i.categoria === cat)
              const catPhotos = catItems.filter(i => i.fotos && i.fotos.length > 0)
              return (
                <div key={cat} data-pdf-section style={{ marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#374151' }}>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '10px', width: '30px' }}>Nº</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '10px' }}>{cat.toUpperCase()}</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '35px', textAlign: 'center' }}>C</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '35px', textAlign: 'center' }}>NC</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '35px', textAlign: 'center' }}>N/A</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '120px' }}>Observação</td>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item, idx) => (
                        <tr key={item.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '4px 8px', fontSize: '9px', color: '#6b7280', textAlign: 'center', verticalAlign: 'top' }}>
                            {item.numero}
                          </td>
                          <td style={{ padding: '4px 8px', fontSize: '9px', color: '#1f2937', verticalAlign: 'top', lineHeight: '1.4' }}>
                            {item.descricao}
                          </td>
                          <CheckCell active={item.status === 'conforme'}      color="#10b981" />
                          <CheckCell active={item.status === 'nao_conforme'}  color="#ef4444" />
                          <CheckCell active={item.status === 'nao_aplicavel'} color="#6b7280" />
                          <td style={{ padding: '4px 8px', fontSize: '8px', color: '#6b7280', verticalAlign: 'top' }}>
                            {item.observacao || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {catPhotos.length > 0 && (
                    <div style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e5e7eb', borderTop: 'none' }}>
                      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                        Registros Fotográficos — {cat}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {catPhotos.map(item =>
                          item.fotos?.map((f, fi) => (
                            <div key={`${item.id}-${fi}`} style={{ textAlign: 'center' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={f}
                                alt={`Item ${item.numero}`}
                                style={{ width: '110px', height: '82px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb', display: 'block' }}
                              />
                              <p style={{ fontSize: '7px', color: '#9ca3af', marginTop: '2px' }}>Item {item.numero}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* ── OBSERVATIONS ────────────────────────────────────────── */}
            <div data-pdf-section style={{ marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ background: '#374151' }}>
                    <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '10px' }}>OBSERVAÇÕES GERAIS</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', fontSize: '9px', color: '#374151', minHeight: '40px' }}>
                      {inspection.observacoes_gerais || 'Sem observações adicionais.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── SIGNATURE ───────────────────────────────────────────── */}
            <div data-pdf-section style={{ marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr style={{ background: '#1e40af' }}>
                    <td colSpan={2} style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '10px' }}>
                      RESPONSÁVEL PELA INSPEÇÃO OU VISTORIA
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', width: '60%', borderRight: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '9px', color: '#374151', marginBottom: '4px' }}>
                        Nome: {inspection.nome_inspetor || inspection.tecnico_responsavel}
                      </p>
                      {inspection.assinatura_inspetor && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inspection.assinatura_inspetor} alt="Assinatura" style={{ height: '60px', objectFit: 'contain' }} />
                      )}
                      <div style={{ borderBottom: '1px solid #374151', marginTop: '6px' }} />
                      <p style={{ fontSize: '8px', color: '#9ca3af', marginTop: '2px' }}>Assinatura</p>
                    </td>
                    <td style={{ padding: '8px', width: '40%' }}>
                      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#374151' }}>Equipamento Liberado:</p>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: inspection.equipamento_liberado ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                        {inspection.equipamento_liberado ? '☑ SIM  ☐ NÃO' : '☐ SIM  ☑ NÃO'}
                      </p>
                      <div style={{ marginTop: '8px' }}>
                        <p style={{ fontSize: '9px', color: '#374151' }}>Validade da Credencial: ___/___/______</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── LEGEND ──────────────────────────────────────────────── */}
            <div
              data-pdf-section
              style={{ padding: '6px 8px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <p style={{ fontSize: '8px', color: '#6b7280', margin: 0 }}>
                LEGENDA: <strong>C</strong> (conforme) &nbsp; <strong>NC</strong> (não conforme) &nbsp; <strong>N.A</strong> (não se aplica)
              </p>
              <p style={{ fontSize: '8px', color: '#6b7280', margin: 0 }}>
                Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action button */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={generatePDF}
            disabled={generating}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-95 disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #003087, #0052cc)' }}
          >
            {generating
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando PDF...</>
              : <><Download className="w-5 h-5" /> Baixar PDF Completo</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function PDFCell({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', verticalAlign: 'top', fontSize: '9px' }}>
      <span style={{ color: '#6b7280', display: 'block' }}>{label}</span>
      <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{value || '—'}</span>
    </td>
  )
}

function CheckCell({ active, color }: { active: boolean; color: string }) {
  return (
    <td style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', border: '1px solid #f3f4f6' }}>
      {active ? (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '16px', height: '16px', borderRadius: '3px',
          background: color, color: 'white', fontSize: '12px', fontWeight: 'bold', lineHeight: '1',
        }}>✓</span>
      ) : (
        <span style={{
          display: 'inline-block', width: '16px', height: '16px',
          borderRadius: '3px', border: '1px solid #d1d5db',
        }} />
      )}
    </td>
  )
}
