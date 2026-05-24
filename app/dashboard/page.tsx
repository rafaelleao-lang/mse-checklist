'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Check, X, ClipboardList } from 'lucide-react'
import { getUser, saveUser } from '@/lib/localStorage'
import { EquipmentType } from '@/types'

const EQUIPMENT_CARDS: {
  tipo: EquipmentType
  label: string
  sublabel: string
  gradient: string
  icon: string
}[] = [
  {
    tipo: 'pemt',
    label: 'PEMT',
    sublabel: 'Plataforma Elevatória Móvel',
    gradient: 'linear-gradient(145deg, #1e3a8a, #2563eb)',
    icon: '🏗️',
  },
  {
    tipo: 'empilhadeira',
    label: 'Empilhadeira',
    sublabel: 'Contrapesada / Retrátil',
    gradient: 'linear-gradient(145deg, #92400e, #d97706)',
    icon: '🚜',
  },
  {
    tipo: 'caminhao_carroceria',
    label: 'Caminhão',
    sublabel: 'Carroceria / Plataforma',
    gradient: 'linear-gradient(145deg, #1e293b, #334155)',
    icon: '🚚',
  },
  {
    tipo: 'guindauto',
    label: 'Guindauto',
    sublabel: 'Caminhão Munck / Grua',
    gradient: 'linear-gradient(145deg, #134e4a, #0d9488)',
    icon: '🏋️',
  },
  {
    tipo: 'manipuladora',
    label: 'Manipuladora',
    sublabel: 'Telescópica / Articulada',
    gradient: 'linear-gradient(145deg, #3b0764, #7c3aed)',
    icon: '🔩',
  },
  {
    tipo: 'outros',
    label: 'Outros',
    sublabel: 'Demais Equipamentos',
    gradient: 'linear-gradient(145deg, #374151, #6b7280)',
    icon: '⚙️',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ nome: string; cargo: string; empresa: string } | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileNome, setProfileNome] = useState('')
  const [profileCargo, setProfileCargo] = useState('')
  const [profileEmpresa, setProfileEmpresa] = useState('MSE Engenharia')

  useEffect(() => {
    const u = getUser()
    if (!u || !u.nome) {
      setShowProfileModal(true)
    } else {
      setUser(u)
    }
  }, [])

  function handleSaveProfile() {
    if (!profileNome.trim()) return
    const u = {
      nome: profileNome.trim(),
      cargo: profileCargo.trim() || 'Técnico de Segurança',
      empresa: profileEmpresa.trim() || 'MSE Engenharia',
    }
    saveUser(u)
    setUser(u)
    setShowProfileModal(false)
  }

  const firstName = user?.nome?.split(' ')[0] || 'Técnico'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="MSE" width={56} height={36} className="object-contain" />
            <div>
              <p className="text-xs text-gray-500 leading-none">Olá, {firstName}</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">Check List Digital</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (user) {
                setProfileNome(user.nome)
                setProfileCargo(user.cargo)
                setProfileEmpresa(user.empresa)
              }
              setShowProfileModal(true)
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            title="Editar perfil"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10">
        {/* Page title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-[#003087]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Selecione o Equipamento</h1>
            <p className="text-xs text-gray-500">Toque no card para iniciar a inspeção</p>
          </div>
        </div>

        {/* Equipment cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_CARDS.map((card, i) => (
            <motion.button
              key={card.tipo}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
              onClick={() => router.push(`/inspecoes/nova/checklist?tipo=${card.tipo}`)}
              className="relative overflow-hidden rounded-2xl shadow-md active:scale-95 transition-transform text-left"
              style={{ minHeight: 150 }}
            >
              {/* Gradient background */}
              <div
                className="absolute inset-0"
                style={{ background: card.gradient }}
              />

              {/* Subtle pattern overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)',
                }}
              />

              {/* Content */}
              <div className="relative p-4 flex flex-col justify-between h-full" style={{ minHeight: 150 }}>
                {/* Icon */}
                <div className="text-4xl mb-2 select-none">{card.icon}</div>

                {/* Text */}
                <div>
                  <p className="text-white font-black text-base leading-tight">{card.label}</p>
                  <p className="text-white/70 text-[11px] mt-0.5 leading-tight">{card.sublabel}</p>

                  {/* Badge */}
                  <div className="mt-2.5 inline-flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
                    <span className="text-white text-[10px] font-bold">Iniciar Inspeção →</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-6 bg-[#003087]/5 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <p className="text-xs font-semibold text-[#003087]">Como funciona</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Selecione o equipamento, preencha os dados, responda o checklist, assine e gere o PDF. Nenhum dado é salvo no servidor.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => user && setShowProfileModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10"
            >
              {user && (
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="flex flex-col items-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#003087]/10 flex items-center justify-center mb-3">
                  <User className="w-7 h-7 text-[#003087]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {user ? 'Editar Perfil' : 'Quem está inspecionando?'}
                </h2>
                <p className="text-sm text-gray-500 text-center mt-1">
                  {user ? 'Altere seus dados de identificação' : 'Informe seus dados para continuar'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={profileNome}
                    onChange={e => setProfileNome(e.target.value)}
                    placeholder="Ex: Paula Gardenia de Freitas"
                    autoFocus
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]"
                    onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={profileCargo}
                    onChange={e => setProfileCargo(e.target.value)}
                    placeholder="Ex: Técnico de Segurança do Trabalho"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={profileEmpresa}
                    onChange={e => setProfileEmpresa(e.target.value)}
                    placeholder="MSE Engenharia"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={!profileNome.trim()}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #003087, #0052cc)' }}
                >
                  <Check className="w-4 h-4" />
                  {user ? 'Salvar alterações' : 'Começar a usar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
