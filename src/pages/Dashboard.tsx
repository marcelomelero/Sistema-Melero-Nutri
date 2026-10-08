import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getNutricionistaByEmail, getDashboardStats, DashboardStats } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, AlertCircle, Sparkles, ChevronRight, UserCheck, RefreshCw } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchStats = async (showRefreshState = false) => {
    if (!user?.email) return
    if (showRefreshState) setRefreshing(true)
    else setLoading(true)

    try {
      const nutri = await getNutricionistaByEmail(user.email)
      if (nutri?.id) {
        const data = await getDashboardStats(nutri.id)
        setStats(data)
      }
    } catch (err) {
      console.error('Erro ao recarregar dados do dashboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [user?.email])

  return (
    <div className="space-y-8">
      {/* Header & Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white p-6 sm:p-8 shadow-lg shadow-emerald-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-emerald-100 mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Painel Principal — Sincronizado Neon DB
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Olá, {user?.name || 'Nutricionista'}! 👋
            </h1>
            <p className="mt-1.5 text-emerald-100 text-sm sm:text-base max-w-xl leading-relaxed">
              Acompanhe o desempenho de sua clínica, consultas registradas da semana e alertas de acompanhamento.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-xs text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Informação — 3 Cards Principais (Prompt 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 — Total de pacientes ativos */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total de Pacientes Ativos</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg my-1" />
            ) : (
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.totalPacientes}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Pacientes vinculados à sua conta
            </p>
          </CardContent>
        </Card>

        {/* Card 2 — Consultas da semana */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Consultas da Semana</CardTitle>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600 border border-teal-100">
              <Calendar className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg my-1" />
            ) : (
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.consultasSemana}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Registradas no período da semana atual
            </p>
          </CardContent>
        </Card>

        {/* Card 3 — Pacientes sem retorno */}
        <Card className="hover:shadow-md transition-shadow border-amber-200/80 bg-white md:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Pacientes sem Retorno
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Última consulta há mais de 30 dias sem retorno agendado
                </CardDescription>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                {stats.pacientesSemRetorno.length}
              </span>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="space-y-2 py-2">
                  <div className="h-8 bg-slate-100 animate-pulse rounded-lg" />
                  <div className="h-8 bg-slate-100 animate-pulse rounded-lg" />
                </div>
              ) : stats.pacientesSemRetorno.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center my-2">
                  <p className="text-xs font-semibold text-emerald-800">
                    Nenhum paciente sem retorno no momento
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Todos os seus pacientes estão com retornos em dia! 🎉
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {stats.pacientesSemRetorno.map((paciente) => (
                    <div
                      key={paciente.id}
                      onClick={() => navigate(`/pacientes/${paciente.id}`)}
                      className="py-2.5 px-2 hover:bg-amber-50/60 rounded-lg transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-700 transition-colors truncate">
                          {paciente.nome}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Sem consulta há <strong className="text-amber-700 font-bold">{paciente.dias_sem_consulta} dias</strong>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Painel Informativo Adicional */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Status do Sistema e Banco de Dados</CardTitle>
          <CardDescription>
            Conectado com sucesso ao Neon PostgreSQL na região AWS sa-east-1 (São Paulo).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">Nutricionista Logado</span>
                <span className="font-bold text-slate-800">{user?.name}</span>
                <span className="text-xs text-slate-500 block">{user?.email}</span>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase block mb-1">Gestão de Pacientes</span>
                <span className="text-xs text-slate-600 block mb-2">Acesse a lista completa de pacientes no menu lateral.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/pacientes')}
                  className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Users className="w-3.5 h-3.5 mr-1" /> Ir para Pacientes
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
