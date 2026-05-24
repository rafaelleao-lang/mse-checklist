'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Check, X, ClipboardList } from 'lucide-react'
import { getUser, saveUser } from '@/lib/localStorage'
import { EquipmentType } from '@/types'

// ── SVG ILLUSTRATIONS ─────────────────────────────────────────────────────────

function IconPEMT() {
  return (
    <svg viewBox="0 0 110 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Platform top + railing */}
      <rect x="12" y="10" width="86" height="9" rx="2" fill="white" opacity="0.95"/>
      <rect x="12" y="3" width="86" height="3" rx="1" fill="white" opacity="0.75"/>
      <line x1="18" y1="3" x2="18" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
      <line x1="55" y1="3" x2="55" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="92" y1="3" x2="92" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
      {/* Scissors X left */}
      <line x1="22" y1="75" x2="52" y2="19" stroke="white" strokeWidth="4.5" strokeLinecap="round" opacity="0.95"/>
      <line x1="52" y1="75" x2="22" y2="47" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.65"/>
      {/* Scissors X right */}
      <line x1="58" y1="75" x2="88" y2="19" stroke="white" strokeWidth="4.5" strokeLinecap="round" opacity="0.95"/>
      <line x1="88" y1="75" x2="58" y2="47" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.65"/>
      {/* Base */}
      <rect x="8" y="75" width="94" height="8" rx="3" fill="white" opacity="0.9"/>
      {/* Wheels */}
      <circle cx="24" cy="83" r="6" fill="white" opacity="0.95"/>
      <circle cx="24" cy="83" r="3" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/>
      <circle cx="86" cy="83" r="6" fill="white" opacity="0.95"/>
      <circle cx="86" cy="83" r="3" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/>
    </svg>
  )
}

function IconEmpilhadeira() {
  return (
    <svg viewBox="0 0 110 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Mast vertical */}
      <rect x="6" y="16" width="8" height="62" rx="2" fill="white" opacity="0.95"/>
      <rect x="17" y="16" width="5" height="62" rx="1.5" fill="white" opacity="0.6"/>
      {/* Forks */}
      <rect x="3" y="65" width="32" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="3" y="74" width="32" height="5" rx="1.5" fill="white" opacity="0.9"/>
      {/* Carriage plate */}
      <rect x="21" y="52" width="7" height="28" rx="2" fill="white" opacity="0.7"/>
      {/* Main body */}
      <rect x="27" y="48" width="60" height="32" rx="5" fill="white" opacity="0.9"/>
      {/* Cab */}
      <rect x="32" y="28" width="38" height="24" rx="4" fill="white" opacity="0.9"/>
      {/* Cab window */}
      <rect x="37" y="32" width="28" height="14" rx="2" fill="white" opacity="0.25"/>
      {/* Counterweight */}
      <rect x="82" y="52" width="10" height="28" rx="4" fill="white" opacity="0.8"/>
      {/* Exhaust pipe */}
      <rect x="60" y="18" width="4" height="12" rx="1.5" fill="white" opacity="0.6"/>
      <ellipse cx="62" cy="17" rx="4" ry="2" fill="white" opacity="0.4"/>
      {/* Wheels */}
      <circle cx="44" cy="82" r="8" fill="white" opacity="0.95"/>
      <circle cx="44" cy="82" r="4" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
      <circle cx="78" cy="82" r="7" fill="white" opacity="0.95"/>
      <circle cx="78" cy="82" r="3.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
    </svg>
  )
}

function IconCaminhao() {
  return (
    <svg viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Cargo bed (flat) */}
      <rect x="44" y="55" width="82" height="10" rx="2" fill="white" opacity="0.9"/>
      {/* Bed stakes */}
      <line x1="55" y1="46" x2="55" y2="65" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
      <line x1="80" y1="46" x2="80" y2="65" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
      <line x1="105" y1="46" x2="105" y2="65" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
      {/* Cabin body */}
      <rect x="6" y="50" width="42" height="22" rx="4" fill="white" opacity="0.95"/>
      {/* Cabin top */}
      <path d="M10 50 L14 35 L44 35 L48 50 Z" fill="white" opacity="0.9"/>
      {/* Windshield */}
      <path d="M16 38 L44 38 L44 49 L16 49 Z" fill="white" opacity="0.28" rx="2"/>
      {/* Headlight */}
      <rect x="7" y="64" width="6" height="4" rx="1" fill="white" opacity="0.7"/>
      {/* Chassis */}
      <rect x="6" y="68" width="120" height="7" rx="2" fill="white" opacity="0.8"/>
      {/* Front wheel */}
      <circle cx="28" cy="80" r="10" fill="white" opacity="0.95"/>
      <circle cx="28" cy="80" r="5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
      {/* Rear wheels */}
      <circle cx="90" cy="80" r="10" fill="white" opacity="0.95"/>
      <circle cx="90" cy="80" r="5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
      <circle cx="112" cy="80" r="10" fill="white" opacity="0.95"/>
      <circle cx="112" cy="80" r="5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
    </svg>
  )
}

function IconGuindauto() {
  return (
    <svg viewBox="0 0 130 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Crane arm (lança) */}
      <line x1="68" y1="68" x2="118" y2="12" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.95"/>
      <line x1="68" y1="68" x2="120" y2="14" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.5"/>
      {/* Cable from tip */}
      <line x1="119" y1="12" x2="119" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" strokeDasharray="4,3"/>
      {/* Hook */}
      <path d="M115 34 Q119 42 123 34" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9"/>
      <line x1="119" y1="36" x2="119" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      {/* Crane base / turret on truck bed */}
      <rect x="56" y="60" width="24" height="14" rx="3" fill="white" opacity="0.85"/>
      {/* Truck cabin */}
      <rect x="4" y="52" width="40" height="22" rx="4" fill="white" opacity="0.95"/>
      <path d="M8 52 L12 37 L40 37 L44 52 Z" fill="white" opacity="0.9"/>
      <path d="M14 40 L40 40 L40 51 L14 51 Z" fill="white" opacity="0.25"/>
      {/* Outriggers */}
      <line x1="58" y1="73" x2="52" y2="86" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.7"/>
      <rect x="46" y="83" width="12" height="4" rx="2" fill="white" opacity="0.7"/>
      <line x1="76" y1="73" x2="82" y2="86" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.7"/>
      <rect x="76" y="83" width="12" height="4" rx="2" fill="white" opacity="0.7"/>
      {/* Chassis */}
      <rect x="4" y="72" width="88" height="7" rx="2" fill="white" opacity="0.8"/>
      {/* Wheels */}
      <circle cx="22" cy="84" r="9" fill="white" opacity="0.95"/>
      <circle cx="22" cy="84" r="4.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
      <circle cx="76" cy="84" r="9" fill="white" opacity="0.95"/>
      <circle cx="76" cy="84" r="4.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
      <circle cx="94" cy="84" r="9" fill="white" opacity="0.95"/>
      <circle cx="94" cy="84" r="4.5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
    </svg>
  )
}

function IconManipuladora() {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Telescoping boom arm */}
      <line x1="52" y1="54" x2="10" y2="20" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.95"/>
      {/* Inner section (telescoped out) */}
      <line x1="38" y1="40" x2="5" y2="16" stroke="white" strokeWidth="4.5" strokeLinecap="round" opacity="0.55"/>
      {/* Fork attachment at tip */}
      <line x1="3" y1="10" x2="3" y2="27" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.95"/>
      <line x1="3" y1="14" x2="-4" y2="14" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
      <line x1="3" y1="22" x2="-4" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
      {/* Main body */}
      <rect x="16" y="52" width="80" height="22" rx="5" fill="white" opacity="0.9"/>
      {/* Cab */}
      <rect x="72" y="36" width="28" height="20" rx="4" fill="white" opacity="0.95"/>
      {/* Cab window */}
      <rect x="76" y="39" width="20" height="12" rx="2" fill="white" opacity="0.28"/>
      {/* Boom pivot mount */}
      <circle cx="52" cy="55" r="5" fill="white" opacity="0.7"/>
      {/* Hydraulic cylinder */}
      <line x1="58" y1="54" x2="28" y2="36" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      {/* Chassis */}
      <rect x="14" y="70" width="84" height="6" rx="2" fill="white" opacity="0.75"/>
      {/* Wheels */}
      <circle cx="30" cy="80" r="10" fill="white" opacity="0.95"/>
      <circle cx="30" cy="80" r="5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
      <circle cx="86" cy="80" r="10" fill="white" opacity="0.95"/>
      <circle cx="86" cy="80" r="5" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
    </svg>
  )
}

function IconOutros() {
  return (
    <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Excavator body / house */}
      <rect x="14" y="44" width="68" height="28" rx="5" fill="white" opacity="0.9"/>
      {/* Cab */}
      <rect x="46" y="30" width="30" height="20" rx="4" fill="white" opacity="0.95"/>
      <rect x="50" y="34" width="22" height="11" rx="2" fill="white" opacity="0.28"/>
      {/* Boom arm (big) */}
      <line x1="20" y1="44" x2="72" y2="22" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.9"/>
      {/* Stick arm */}
      <line x1="72" y1="22" x2="100" y2="46" stroke="white" strokeWidth="5.5" strokeLinecap="round" opacity="0.85"/>
      {/* Bucket */}
      <path d="M95 43 Q108 58 95 63 Q83 63 84 52 Z" fill="white" opacity="0.9"/>
      {/* Hydraulic cylinders */}
      <line x1="32" y1="44" x2="62" y2="26" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.45"/>
      <line x1="70" y1="24" x2="94" y2="42" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.45"/>
      {/* Tracks */}
      <rect x="8" y="70" width="80" height="13" rx="6" fill="white" opacity="0.9"/>
      <rect x="14" y="73" width="68" height="7" rx="3" fill="white" opacity="0.45"/>
      <circle cx="18" cy="76" r="5" fill="white" opacity="0.7"/>
      <circle cx="78" cy="76" r="5" fill="white" opacity="0.7"/>
      <circle cx="48" cy="76" r="4" fill="white" opacity="0.55"/>
    </svg>
  )
}

// ── EQUIPMENT CARDS CONFIG ────────────────────────────────────────────────────

const EQUIPMENT_CARDS: {
  tipo: EquipmentType
  label: string
  sublabel: string
  gradient: string
  Icon: () => React.ReactElement
}[] = [
  {
    tipo: 'pemt',
    label: 'PEMT',
    sublabel: 'Plataforma Elevatória Móvel',
    gradient: 'linear-gradient(145deg, #1e3a8a, #2563eb)',
    Icon: IconPEMT,
  },
  {
    tipo: 'empilhadeira',
    label: 'Empilhadeira',
    sublabel: 'Contrapesada / Retrátil',
    gradient: 'linear-gradient(145deg, #92400e, #d97706)',
    Icon: IconEmpilhadeira,
  },
  {
    tipo: 'caminhao_carroceria',
    label: 'Caminhão',
    sublabel: 'Carroceria / Plataforma',
    gradient: 'linear-gradient(145deg, #1e293b, #334155)',
    Icon: IconCaminhao,
  },
  {
    tipo: 'guindauto',
    label: 'Guindauto',
    sublabel: 'Caminhão Munck / Grua',
    gradient: 'linear-gradient(145deg, #134e4a, #0d9488)',
    Icon: IconGuindauto,
  },
  {
    tipo: 'manipuladora',
    label: 'Manipuladora',
    sublabel: 'Telescópica / Articulada',
    gradient: 'linear-gradient(145deg, #3b0764, #7c3aed)',
    Icon: IconManipuladora,
  },
  {
    tipo: 'outros',
    label: 'Outros',
    sublabel: 'Demais Equipamentos',
    gradient: 'linear-gradient(145deg, #374151, #6b7280)',
    Icon: IconOutros,
  },
]

// ── PAGE ──────────────────────────────────────────────────────────────────────

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
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10">
        {/* Title */}
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
          {EQUIPMENT_CARDS.map((card, i) => {
            const Icon = card.Icon
            return (
              <motion.button
                key={card.tipo}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                onClick={() => router.push(`/inspecoes/nova/checklist?tipo=${card.tipo}`)}
                className="relative overflow-hidden rounded-2xl shadow-md active:scale-95 transition-transform text-left"
                style={{ minHeight: 168 }}
              >
                <div className="absolute inset-0" style={{ background: card.gradient }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 15%, white 0%, transparent 55%)' }} />

                <div className="relative p-4 flex flex-col h-full" style={{ minHeight: 168 }}>
                  {/* Machine SVG illustration */}
                  <div className="flex-1 flex items-center justify-center" style={{ height: 82 }}>
                    <div className="w-full" style={{ maxHeight: 82 }}>
                      <Icon />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="mt-1">
                    <p className="text-white font-black text-[15px] leading-tight">{card.label}</p>
                    <p className="text-white/70 text-[10px] mt-0.5 leading-tight">{card.sublabel}</p>
                    <div className="mt-2 inline-flex items-center bg-white/20 rounded-lg px-2 py-1">
                      <span className="text-white text-[10px] font-bold">Iniciar Inspeção →</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-6 bg-[#003087]/5 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">ℹ️</span>
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => user && setShowProfileModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10"
            >
              {user && (
                <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="flex flex-col items-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#003087]/10 flex items-center justify-center mb-3">
                  <User className="w-7 h-7 text-[#003087]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{user ? 'Editar Perfil' : 'Quem está inspecionando?'}</h2>
                <p className="text-sm text-gray-500 text-center mt-1">{user ? 'Altere seus dados de identificação' : 'Informe seus dados para continuar'}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nome Completo *</label>
                  <input type="text" value={profileNome} onChange={e => setProfileNome(e.target.value)} placeholder="Ex: Paula Gardenia de Freitas" autoFocus
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]"
                    onKeyDown={e => e.key === 'Enter' && handleSaveProfile()} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cargo</label>
                  <input type="text" value={profileCargo} onChange={e => setProfileCargo(e.target.value)} placeholder="Ex: Técnico de Segurança do Trabalho"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Empresa</label>
                  <input type="text" value={profileEmpresa} onChange={e => setProfileEmpresa(e.target.value)} placeholder="MSE Engenharia"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]" />
                </div>
                <button onClick={handleSaveProfile} disabled={!profileNome.trim()}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 mt-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #003087, #0052cc)' }}>
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
