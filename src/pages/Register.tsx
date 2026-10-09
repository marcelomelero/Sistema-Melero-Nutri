import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { User as UserIcon, Mail, Lock, Loader2, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Regra: Senha mínima de 9 caracteres
    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Verifique e tente novamente.')
      return
    }

    setIsLoading(true)

    try {
      const result = await register(name, email, password)
      if (result.error) {
        setErrorMessage(result.error)
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao criar sua conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const isPasswordLengthValid = password.length >= 9
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-3.5 sm:px-4 py-8 sm:py-12 bg-gradient-to-br from-emerald-50/50 via-slate-50 to-teal-50/40 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-20 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 -right-20 w-72 sm:w-96 h-72 sm:h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Logo */}
      <div className="mb-6 sm:mb-8 transition-transform hover:scale-[1.02] duration-300">
        <Logo size="lg" />
      </div>

      <Card className="w-full max-w-md border-slate-100/80 shadow-2xl shadow-emerald-950/5 bg-white/95 backdrop-blur-md">
        <CardHeader className="space-y-1.5 text-center p-4 sm:p-6 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800">
            Criar Conta Profissional
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs sm:text-sm">
            Cadastre-se para gerenciar seus pacientes e planos alimentares
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200/70 text-red-700 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr(a). Seu Nome"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email profissional</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@nutricao.com.br"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha de acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 9 caracteres"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isPasswordLengthValid ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <span>Mínimo de 9 caracteres</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita sua senha"
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs pt-0.5">
                  {doPasswordsMatch ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Senhas conferem
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">
                      As senhas não conferem
                    </span>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 h-11 text-base font-semibold shadow-md shadow-emerald-600/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 text-center border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <p className="text-sm text-slate-600">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-xs text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Seus dados cadastrais são integrados com segurança ao Neon PostgreSQL
      </div>
    </div>
  )
}
