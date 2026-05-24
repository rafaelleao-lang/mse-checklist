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
      // Read from sessionStorage (no-save flow)
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

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = imgWidth / imgHeight
      const pageImgHeight = pdfWidth / ratio

      let position = 0
      let remainingHeight = pageImgHeight

      if (pageImgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pageImgHeight)
      } else {
        while (remainingHeight > 0) {
          pdf.addImage(imgData, 'PNG', 0, position === 0 ? 0 : -(pageImgHeight - remainingHeight), pdfWidth, pageImgHeight)
          remainingHeight -= pdfHeight
          if (remainingHeight > 0) {
            pdf.addPage()
            position += pdfHeight
          }
        }
      }

      const filename = `MSE_CheckList_${inspection.tipo_equipamento.toUpperCase()}_${inspection.tag || inspection.placa || 'SN'}_${inspection.data_inspecao.replace(/\//g, '-')}.pdf`
      pdf.save(filename)
      setGenerated(true)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
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
  const conformes = inspection.itens.filter(i => i.status === 'conforme')
  const naItems = inspection.itens.filter(i => i.status === 'nao_aplicavel')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm no-print">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="flex-1 text-sm font-bold text-gray-900">Visualização do Relatório</p>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #003087, #0052cc)' }}
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
            ) : (
              <><Download className="w-4 h-4" /> Baixar PDF</>
            )}
          </button>
        </div>
      </header>

      {generated && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 pt-3 no-print"
        >
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-sm text-emerald-700 font-medium">PDF gerado com sucesso!</p>
          </div>
        </motion.div>
      )}

      {/* PDF Preview */}
      <div className="max-w-4xl mx-auto p-4 pb-8">
        <div
          ref={previewRef}
          className="bg-white shadow-xl"
          style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: '10px' }}
        >
          {/* PDF HEADER */}
          <div style={{ background: '#003087', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'white', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo.png" alt="MSE" style={{ height: '36px', width: 'auto', display: 'block' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', margin: 0 }}>MSE Engenharia</p>
                <p style={{ color: '#93c5fd', fontSize: '9px', margin: 0 }}>Sistema de Gestão em Segurança do Trabalho</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'white', fontWeight: 'bold', fontSize: '12px', margin: 0 }}>
                CHECK LIST DE INSPEÇÃO
              </p>
              <p style={{ color: '#93c5fd', fontSize: '9px', margin: 0 }}>
                {EQUIPMENT_LABELS[inspection.tipo_equipamento]}
              </p>
            </div>
          </div>

          {/* Status banner */}
          <div style={{
            background: inspection.status === 'aprovado' ? '#d1fae5' : inspection.status === 'reprovado' ? '#fee2e2' : '#fef3c7',
            borderBottom: `3px solid ${inspection.status === 'aprovado' ? '#10b981' : inspection.status === 'reprovado' ? '#ef4444' : '#f59e0b'}`,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'black',
                color: inspection.status === 'aprovado' ? '#065f46' : inspection.status === 'reprovado' ? '#7f1d1d' : '#78350f'
              }}>
                EQUIPAMENTO {inspection.status === 'aprovado' ? '✓ APROVADO' : inspection.status === 'reprovado' ? '✗ REPROVADO' : '⏳ PENDENTE'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '9px', color: '#374151', margin: 0 }}>
                {conformes.length} Conformes • {naoConformes.length} Não Conformes • {naItems.length} N/A
              </p>
            </div>
          </div>

          {/* Main info table */}
          <div style={{ padding: '12px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
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

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
              <thead>
                <tr style={{ background: '#1e40af' }}>
                  <td colSpan={6} style={{ color: 'white', fontWeight: 'bold', padding: '6px 8px', fontSize: '10px' }}>
                    ACESSÓRIOS — EQUIPAMENTO
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8fafc' }}>
                  <PDFCell label="Tipo de Equipamento" value={EQUIPMENT_LABELS[inspection.tipo_equipamento].split(' - ')[0]} />
                  <PDFCell label="TAG / Nº Série" value={inspection.tag || 'N/A'} />
                  <PDFCell label="Placa" value={inspection.placa || 'N/A'} />
                  <PDFCell label="Ano" value={inspection.ano || 'N/A'} />
                  <PDFCell label="Modelo" value={inspection.modelo || 'N/A'} />
                  <PDFCell label="Fabricante" value={inspection.fabricante || 'N/A'} />
                </tr>
              </tbody>
            </table>

            {/* Checklist items by category */}
            {categories.map(cat => {
              const catItems = inspection.itens.filter(i => i.categoria === cat)
              return (
                <div key={cat} style={{ marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#374151' }}>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '10px', width: '30px' }}>
                          Nº
                        </td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '10px' }}>
                          {cat.toUpperCase()}
                        </td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '35px', textAlign: 'center' }}>C</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '35px', textAlign: 'center' }}>NC</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '35px', textAlign: 'center' }}>N/A</td>
                        <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '9px', width: '100px' }}>Observação</td>
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
                          <CheckCell active={item.status === 'conforme'} color="#10b981" />
                          <CheckCell active={item.status === 'nao_conforme'} color="#ef4444" />
                          <CheckCell active={item.status === 'nao_aplicavel'} color="#6b7280" />
                          <td style={{ padding: '4px 8px', fontSize: '8px', color: '#6b7280', verticalAlign: 'top' }}>
                            {item.observacao || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Photos for this category */}
                  {catItems.some(i => i.fotos && i.fotos.length > 0) && (
                    <div style={{ marginTop: '4px', padding: '6px 8px', background: '#f8fafc', border: '1px solid #e5e7eb', borderTop: 'none' }}>
                      <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Fotos — {cat}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {catItems.filter(i => i.fotos && i.fotos.length > 0).map(item =>
                          item.fotos?.map((f, fi) => (
                            <div key={`${item.id}-${fi}`} style={{ textAlign: 'center' }}>
                              <img src={f} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }} alt="" />
                              <p style={{ fontSize: '7px', color: '#9ca3af', marginTop: '1px' }}>Item {item.numero}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Observations */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
              <thead>
                <tr style={{ background: '#374151' }}>
                  <td style={{ color: 'white', fontWeight: 'bold', padding: '5px 8px', fontSize: '10px' }}>
                    OBSERVAÇÕES GERAIS
                  </td>
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

            {/* Signature — inspector only */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
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
                      <img src={inspection.assinatura_inspetor} alt="Assinatura" style={{ height: '60px', objectFit: 'contain' }} />
                    )}
                    <div style={{ borderBottom: '1px solid #374151', marginTop: '6px' }} />
                    <p style={{ fontSize: '8px', color: '#9ca3af', marginTop: '2px' }}>Assinatura</p>
                  </td>
                  <td style={{ padding: '8px', width: '40%' }}>
                    <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#374151' }}>Equipamento Liberado: </p>
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

            {/* Legend */}
            <div style={{ padding: '6px 8px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '8px', color: '#6b7280' }}>
                LEGENDA: <strong>C</strong> (conforme) &nbsp; <strong>NC</strong> (não conforme) &nbsp; <strong>N.A</strong> (não se aplica)
              </p>
              <p style={{ fontSize: '8px', color: '#6b7280' }}>
                Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-50 no-print">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={generatePDF}
            disabled={generating}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-95 disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #003087, #0052cc)' }}
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Gerando PDF...</>
            ) : (
              <><Download className="w-5 h-5" /> Baixar PDF Completo</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function PDFCell({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      style={{ padding: '4px 8px', border: '1px solid #e5e7eb', verticalAlign: 'top', fontSize: '9px' }}
    >
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
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '3px',
          background: color,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          lineHeight: '1',
        }}>✓</span>
      ) : (
        <span style={{
          display: 'inline-block',
          width: '16px',
          height: '16px',
          borderRadius: '3px',
          border: '1px solid #d1d5db',
        }}></span>
      )}
    </td>
  )
}
