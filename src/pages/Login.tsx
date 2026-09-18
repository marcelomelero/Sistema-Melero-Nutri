import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.error) {
        setErrorMessage(result.error)
      } else {
        navigate('/dashboard')
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao processar seu login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-emerald-50/50 via-slate-50 to-teal-50/40 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Logo */}
      <div className="mb-8 transition-transform hover:scale-[1.02] duration-300">
        <Logo size="lg" />
      </div>

      <Card className="w-full max-w-md border-slate-100/80 shadow-2xl shadow-emerald-950/5 bg-white/95 backdrop-blur-md">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-800">
            Acessar Plataforma
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Digite seu email e senha para entrar no seu painel nutricional
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200/70 text-red-700 rounded-xl text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email profissional</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@nutricao.com.br"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha de acesso</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="•••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 h-11 text-base font-semibold shadow-md shadow-emerald-600/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 text-center border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <p className="text-sm text-slate-600">
            Não tem uma conta?{' '}
            <Link
              to="/cadastro"
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-xs text-slate-400 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Ambiente seguro com criptografia e Neon Auth
      </div>
    </div>
  )
}
