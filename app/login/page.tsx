'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, LogIn } from 'lucide-react'
import { saveUser } from '@/lib/localStorage'

const DEMO_USERS = [
  { email: 'tecnico@mse.com.br', senha: '123456', nome: 'Paula Gardenia de Freitas', cargo: 'Técnica de Segurança do Trabalho', empresa: 'MSE Engenharia' },
  { email: 'admin@mse.com.br', senha: '123456', nome: 'Administrador MSE', cargo: 'Coordenador de SST', empresa: 'MSE Engenharia' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 800))
    const user = DEMO_USERS.find(u => u.email === email && u.senha === senha)
    if (user) {
      saveUser({ nome: user.nome, cargo: user.cargo, empresa: user.empresa })
      router.push('/dashboard')
    } else {
      setError('E-mail ou senha inválidos. Use tecnico@mse.com.br / 123456')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #001f5c 0%, #003087 40%, #0052cc 100%)' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: '#ff6b00' }} />
        <div className="absolute top-1/2 -left-20 w-60 h-60 rounded-full opacity-5" style={{ background: '#ffffff' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-5" style={{ background: '#0052cc' }} />
        <svg className="absolute bottom-0 left-0 right-0 opacity-10" viewBox="0 0 1440 200" fill="none">
          <path d="M0,100 C360,0 720,200 1440,100 L1440,200 L0,200 Z" fill="white" />
        </svg>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-4 overflow-hidden">
              <Image src="/logo.png" alt="MSE Engenharia" width={80} height={80} className="object-contain" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-wide">MSE Engenharia</h1>
            <p className="text-blue-200 text-sm mt-1">Check List Digital de Inspeções</p>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#003087' }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Acesso Seguro</h2>
                <p className="text-gray-500 text-xs">Entre com suas credenciais</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@mse.com.br"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 transition-all"
                  style={{ '--tw-ring-color': '#003087' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 transition-all pr-12"
                    style={{ '--tw-ring-color': '#003087' } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-xs"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #003087, #0052cc)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">Acesso demo: tecnico@mse.com.br / 123456</p>
            </div>
          </motion.div>

          <p className="text-center text-blue-300 text-xs mt-6">
            © 2025 MSE Engenharia — Sistema de Gestão SST
          </p>
        </motion.div>
      </div>
    </div>
  )
}
