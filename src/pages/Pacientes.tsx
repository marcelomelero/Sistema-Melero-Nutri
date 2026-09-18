import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { sql, getNutricionistaByEmail } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, UserPlus, Search, Calendar, Phone, Mail, FileText, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export interface Paciente {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: string
  sexo?: string
  whatsapp?: string
  email?: string
  peso_inicial?: number
  altura?: number
  objetivo_texto?: string
  created_at: string
}

export function Pacientes() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('id')

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [nutricionistaId, setNutricionistaId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal / Form para novo paciente
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    data_nascimento: '',
    sexo: 'Feminino',
    peso_inicial: '',
    altura: '',
    objetivo_texto: '',
  })

  // Carregar ID do nutricionista e pacientes do Neon
  useEffect(() => {
    async function loadData() {
      if (!user?.email) return
      setLoading(true)
      try {
        const nutri = await getNutricionistaByEmail(user.email)
        if (nutri?.id) {
          setNutricionistaId(nutri.id)
          const rows = await sql`
            SELECT id, nutricionista_id, nome, data_nascimento::text, sexo, whatsapp, email, peso_inicial::float, altura::float, objetivo_texto, created_at::text
            FROM pacientes
            WHERE nutricionista_id = ${nutri.id}
            ORDER BY nome ASC
          `
          setPacientes(rows as Paciente[])
        }
      } catch (err) {
        console.error('Erro ao carregar pacientes do Neon:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.email])

  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nutricionistaId || !formData.nome.trim()) return

    setFormLoading(true)
    setFormSuccess('')
    try {
      const inserted = await sql`
        INSERT INTO pacientes (
          nutricionista_id,
          nome,
          email,
          whatsapp,
          data_nascimento,
          sexo,
          peso_inicial,
          altura,
          objetivo_texto
        ) VALUES (
          ${nutricionistaId},
          ${formData.nome.trim()},
          ${formData.email.trim() || null},
          ${formData.whatsapp.trim() || null},
          ${formData.data_nascimento || null},
          ${formData.sexo},
          ${formData.peso_inicial ? parseFloat(formData.peso_inicial) : null},
          ${formData.altura ? parseFloat(formData.altura) : null},
          ${formData.objetivo_texto.trim() || null}
        )
        RETURNING id, nutricionista_id, nome, data_nascimento::text, sexo, whatsapp, email, peso_inicial::float, altura::float, objetivo_texto, created_at::text
      `

      if (inserted && inserted.length > 0) {
        const newPac = inserted[0] as Paciente
        setPacientes((prev) => [...prev, newPac].sort((a, b) => a.nome.localeCompare(b.nome)))
        setFormSuccess('Paciente cadastrado com sucesso!')
        setFormData({
          nome: '',
          email: '',
          whatsapp: '',
          data_nascimento: '',
          sexo: 'Feminino',
          peso_inicial: '',
          altura: '',
          objetivo_texto: '',
        })
        setTimeout(() => {
          setShowForm(false)
          setFormSuccess('')
        }, 1500)
      }
    } catch (err) {
      console.error('Erro ao criar paciente:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const filteredPacientes = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedPaciente = selectedId ? pacientes.find((p) => p.id === selectedId) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Gestão de Pacientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Cadastre, acompanhe e gerencie os perfis clínicos de seus pacientes.
          </p>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {showForm ? 'Fechar Formulário' : 'Novo Paciente'}
        </Button>
      </div>

      {/* Form de Cadastro de Paciente */}
      {showForm && (
        <Card className="border-emerald-200 bg-emerald-50/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-900">Cadastrar Novo Paciente</CardTitle>
            <CardDescription>Preencha as informações do paciente para sincronizar com o Neon.</CardDescription>
          </CardHeader>
          <CardContent>
            {formSuccess ? (
              <div className="flex items-center gap-2 p-4 bg-emerald-100 text-emerald-800 rounded-xl font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {formSuccess}
              </div>
            ) : (
              <form onSubmit={handleCreatePaciente} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      required
                      placeholder="Ex: Maria Silva"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="maria@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp">WhatsApp / Telefone</Label>
                    <Input
                      id="whatsapp"
                      placeholder="(11) 99999-9999"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="peso_inicial">Peso Inicial (kg)</Label>
                    <Input
                      id="peso_inicial"
                      type="number"
                      step="0.1"
                      placeholder="65.5"
                      value={formData.peso_inicial}
                      onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="altura">Altura (m)</Label>
                    <Input
                      id="altura"
                      type="number"
                      step="0.01"
                      placeholder="1.68"
                      value={formData.altura}
                      onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="objetivo_texto">Objetivo Principal</Label>
                  <Input
                    id="objetivo_texto"
                    placeholder="Ex: Reeducação alimentar, emagrecimento, hipertrofia..."
                    value={formData.objetivo_texto}
                    onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading} className="bg-emerald-600 hover:bg-emerald-700">
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Paciente'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Se houver paciente selecionado, exibe visualização detalhada */}
      {selectedPaciente ? (
        <Card className="border-emerald-200 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchParams({})}
                className="text-slate-500 hover:text-slate-800 -ml-2 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para a lista
              </Button>
              <CardTitle className="text-xl font-bold text-slate-800">{selectedPaciente.nome}</CardTitle>
              <CardDescription>Perfil Clínico do Paciente</CardDescription>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg">
              {selectedPaciente.nome.charAt(0).toUpperCase()}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center text-xs font-semibold text-slate-400 uppercase gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email
                </div>
                <div className="text-sm font-semibold text-slate-800">{selectedPaciente.email || 'Não informado'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center text-xs font-semibold text-slate-400 uppercase gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                </div>
                <div className="text-sm font-semibold text-slate-800">{selectedPaciente.whatsapp || 'Não informado'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center text-xs font-semibold text-slate-400 uppercase gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Data de Nascimento
                </div>
                <div className="text-sm font-semibold text-slate-800">{selectedPaciente.data_nascimento || 'Não informada'}</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Peso Inicial</div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedPaciente.peso_inicial ? `${selectedPaciente.peso_inicial} kg` : 'Não informado'}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Altura</div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedPaciente.altura ? `${selectedPaciente.altura} m` : 'Não informada'}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Data de Cadastro</div>
                <div className="text-sm font-semibold text-slate-800">
                  {new Date(selectedPaciente.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {selectedPaciente.objetivo_texto && (
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="flex items-center text-xs font-semibold text-emerald-800 uppercase gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-emerald-600" /> Objetivo Clínico
                </div>
                <p className="text-sm text-slate-700">{selectedPaciente.objetivo_texto}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Lista de Pacientes */
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-slate-800">Lista de Pacientes</CardTitle>
                <CardDescription>Total de {pacientes.length} pacientes cadastrados</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Buscar paciente por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando pacientes do Neon...
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Nenhum paciente encontrado</p>
                <p className="text-xs text-slate-500 mt-1">
                  {searchTerm ? 'Tente buscar por outro nome ou email.' : 'Clique no botão "Novo Paciente" acima para cadastrar.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPacientes.map((paciente) => (
                  <div
                    key={paciente.id}
                    onClick={() => setSearchParams({ id: paciente.id })}
                    className="p-4 hover:bg-emerald-50/40 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                        {paciente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                          {paciente.nome}
                        </h4>
                        <p className="text-xs text-slate-500">{paciente.email || paciente.whatsapp || 'Sem contato salvo'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50">
                      Ver Perfil
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
