import { neon } from '@neondatabase/serverless'

const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL || ''

export const sql = neon(databaseUrl)

/**
 * Garante que o nutricionista esteja salvo na tabela `nutricionistas`
 */
export async function syncNutricionista(nome: string, email: string) {
  try {
    // Verifica se já existe nutricionista com esse email
    const existing = await sql`
      SELECT id, nome, email FROM nutricionistas WHERE LOWER(email) = LOWER(${email.trim()}) LIMIT 1
    `
    
    if (existing && existing.length > 0) {
      return existing[0]
    }

    // Insere novo nutricionista
    const inserted = await sql`
      INSERT INTO nutricionistas (nome, email)
      VALUES (${nome.trim()}, ${email.trim()})
      RETURNING id, nome, email, created_at
    `
    return inserted[0]
  } catch (error) {
    console.error('Erro ao sincronizar nutricionista no banco de dados:', error)
    throw error
  }
}

/**
 * Obtém o registro do nutricionista no Neon através do e-mail
 */
export async function getNutricionistaByEmail(email: string) {
  try {
    const rows = await sql`
      SELECT id, nome, email FROM nutricionistas WHERE LOWER(email) = LOWER(${email.trim()}) LIMIT 1
    `
    return rows[0] || null
  } catch (error) {
    console.error('Erro ao buscar nutricionista por email:', error)
    return null
  }
}

export interface PacienteSemRetorno {
  id: string
  nome: string
  ultima_consulta: string
  dias_sem_consulta: number
}

export interface DashboardStats {
  totalPacientes: number
  consultasSemana: number
  pacientesSemRetorno: PacienteSemRetorno[]
}

/**
 * Busca estatísticas do dashboard no Neon em tempo real
 */
export async function getDashboardStats(nutricionistaId: string): Promise<DashboardStats> {
  try {
    // 1. Total de pacientes do nutricionista
    const totalPacientesRes = await sql`
      SELECT COUNT(*)::int as total
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}
    `
    const totalPacientes = Number(totalPacientesRes[0]?.total || 0)

    // 2. Consultas da semana atual
    const consultasSemanaRes = await sql`
      SELECT COUNT(*)::int as total
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
        AND c.data_consulta < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
    `
    const consultasSemana = Number(consultasSemanaRes[0]?.total || 0)

    // 3. Pacientes sem retorno (> 30 dias da última consulta e sem próximo retorno agendado)
    const pacientesSemRetornoRes = await sql`
      SELECT 
        p.id,
        p.nome,
        MAX(c.data_consulta)::text as ultima_consulta,
        (CURRENT_DATE - MAX(c.data_consulta))::int as dias_sem_consulta
      FROM pacientes p
      JOIN consultas c ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
      GROUP BY p.id, p.nome
      HAVING MAX(c.data_consulta) < CURRENT_DATE - INTERVAL '30 days'
        AND (MAX(c.proximo_retorno) IS NULL OR MAX(c.proximo_retorno) < CURRENT_DATE)
      ORDER BY MAX(c.data_consulta) ASC
    `

    const pacientesSemRetorno: PacienteSemRetorno[] = pacientesSemRetornoRes.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      ultima_consulta: row.ultima_consulta,
      dias_sem_consulta: Number(row.dias_sem_consulta || 0),
    }))

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard no Neon:', error)
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    }
  }
}

export interface Paciente {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
  created_at: string
  ultima_consulta?: string | null
}

export interface PacienteInput {
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
}

/**
 * Busca a lista de pacientes cadastrados da nutricionista com a data da última consulta
 */
export async function getPacientes(nutricionistaId: string): Promise<Paciente[]> {
  try {
    const rows = await sql`
      SELECT 
        p.id,
        p.nutricionista_id,
        p.nome,
        p.data_nascimento::text,
        p.sexo,
        p.telefone,
        p.whatsapp,
        p.email,
        p.peso_inicial::float,
        p.altura::float,
        p.objetivos,
        p.objetivo_texto,
        p.nivel_atividade,
        p.patologias,
        p.restricoes_alimentares,
        p.alergias,
        p.medicamentos,
        p.suplementos,
        p.refeicoes_por_dia,
        p.horario_acorda,
        p.horario_dorme,
        p.litros_agua::float,
        p.atividade_fisica,
        p.atividade_fisica_descricao,
        p.observacoes,
        p.created_at::text,
        MAX(c.data_consulta)::text as ultima_consulta
      FROM pacientes p
      LEFT JOIN consultas c ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
      GROUP BY p.id
      ORDER BY p.nome ASC
    `
    return rows as Paciente[]
  } catch (error) {
    console.error('Erro ao buscar pacientes no Neon:', error)
    return []
  }
}

/**
 * Busca os dados completos de um paciente por ID
 */
export async function getPacienteById(id: string, nutricionistaId: string): Promise<Paciente | null> {
  try {
    const rows = await sql`
      SELECT 
        p.id,
        p.nutricionista_id,
        p.nome,
        p.data_nascimento::text,
        p.sexo,
        p.telefone,
        p.whatsapp,
        p.email,
        p.peso_inicial::float,
        p.altura::float,
        p.objetivos,
        p.objetivo_texto,
        p.nivel_atividade,
        p.patologias,
        p.restricoes_alimentares,
        p.alergias,
        p.medicamentos,
        p.suplementos,
        p.refeicoes_por_dia,
        p.horario_acorda,
        p.horario_dorme,
        p.litros_agua::float,
        p.atividade_fisica,
        p.atividade_fisica_descricao,
        p.observacoes,
        p.created_at::text,
        MAX(c.data_consulta)::text as ultima_consulta
      FROM pacientes p
      LEFT JOIN consultas c ON c.paciente_id = p.id
      WHERE p.id = ${id} AND p.nutricionista_id = ${nutricionistaId}
      GROUP BY p.id
      LIMIT 1
    `
    return (rows[0] as Paciente) || null
  } catch (error) {
    console.error('Erro ao buscar paciente por ID:', error)
    return null
  }
}

/**
 * Cadastra um novo paciente no Neon vinculado à nutricionista logada
 */
export async function createPaciente(data: PacienteInput): Promise<Paciente> {
  try {
    const rows = await sql`
      INSERT INTO pacientes (
        nutricionista_id,
        nome,
        data_nascimento,
        sexo,
        telefone,
        whatsapp,
        email,
        peso_inicial,
        altura,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes
      ) VALUES (
        ${data.nutricionista_id},
        ${data.nome.trim()},
        ${data.data_nascimento || null},
        ${data.sexo || null},
        ${data.telefone?.trim() || null},
        ${data.whatsapp?.trim() || null},
        ${data.email?.trim() || null},
        ${data.peso_inicial ?? null},
        ${data.altura ?? null},
        ${data.objetivos && data.objetivos.length > 0 ? data.objetivos : null},
        ${data.objetivo_texto?.trim() || null},
        ${data.nivel_atividade || null},
        ${data.patologias && data.patologias.length > 0 ? data.patologias : null},
        ${data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null},
        ${data.alergias && data.alergias.length > 0 ? data.alergias : null},
        ${data.medicamentos?.trim() || null},
        ${data.suplementos?.trim() || null},
        ${data.refeicoes_por_dia ?? null},
        ${data.horario_acorda?.trim() || null},
        ${data.horario_dorme?.trim() || null},
        ${data.litros_agua ?? null},
        ${data.atividade_fisica ?? false},
        ${data.atividade_fisica_descricao?.trim() || null},
        ${data.observacoes?.trim() || null}
      )
      RETURNING 
        id,
        nutricionista_id,
        nome,
        data_nascimento::text,
        sexo,
        telefone,
        whatsapp,
        email,
        peso_inicial::float,
        altura::float,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua::float,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes,
        created_at::text
    `
    return rows[0] as Paciente
  } catch (error) {
    console.error('Erro ao cadastrar paciente no Neon:', error)
    throw error
  }
}

/**
 * Atualiza os dados de um paciente existente no Neon
 */
export async function updatePaciente(
  id: string,
  nutricionistaId: string,
  data: Partial<PacienteInput>
): Promise<Paciente> {
  try {
    const rows = await sql`
      UPDATE pacientes
      SET
        nome = ${data.nome !== undefined ? data.nome.trim() : sql`nome`},
        data_nascimento = ${data.data_nascimento !== undefined ? (data.data_nascimento || null) : sql`data_nascimento`},
        sexo = ${data.sexo !== undefined ? (data.sexo || null) : sql`sexo`},
        telefone = ${data.telefone !== undefined ? (data.telefone?.trim() || null) : sql`telefone`},
        whatsapp = ${data.whatsapp !== undefined ? (data.whatsapp?.trim() || null) : sql`whatsapp`},
        email = ${data.email !== undefined ? (data.email?.trim() || null) : sql`email`},
        peso_inicial = ${data.peso_inicial !== undefined ? data.peso_inicial : sql`peso_inicial`},
        altura = ${data.altura !== undefined ? data.altura : sql`altura`},
        objetivos = ${data.objetivos !== undefined ? (data.objetivos && data.objetivos.length > 0 ? data.objetivos : null) : sql`objetivos`},
        objetivo_texto = ${data.objetivo_texto !== undefined ? (data.objetivo_texto?.trim() || null) : sql`objetivo_texto`},
        nivel_atividade = ${data.nivel_atividade !== undefined ? (data.nivel_atividade || null) : sql`nivel_atividade`},
        patologias = ${data.patologias !== undefined ? (data.patologias && data.patologias.length > 0 ? data.patologias : null) : sql`patologias`},
        restricoes_alimentares = ${data.restricoes_alimentares !== undefined ? (data.restricoes_alimentares && data.restricoes_alimentares.length > 0 ? data.restricoes_alimentares : null) : sql`restricoes_alimentares`},
        alergias = ${data.alergias !== undefined ? (data.alergias && data.alergias.length > 0 ? data.alergias : null) : sql`alergias`},
        medicamentos = ${data.medicamentos !== undefined ? (data.medicamentos?.trim() || null) : sql`medicamentos`},
        suplementos = ${data.suplementos !== undefined ? (data.suplementos?.trim() || null) : sql`suplementos`},
        refeicoes_por_dia = ${data.refeicoes_por_dia !== undefined ? data.refeicoes_por_dia : sql`refeicoes_por_dia`},
        horario_acorda = ${data.horario_acorda !== undefined ? (data.horario_acorda?.trim() || null) : sql`horario_acorda`},
        horario_dorme = ${data.horario_dorme !== undefined ? (data.horario_dorme?.trim() || null) : sql`horario_dorme`},
        litros_agua = ${data.litros_agua !== undefined ? data.litros_agua : sql`litros_agua`},
        atividade_fisica = ${data.atividade_fisica !== undefined ? data.atividade_fisica : sql`atividade_fisica`},
        atividade_fisica_descricao = ${data.atividade_fisica_descricao !== undefined ? (data.atividade_fisica_descricao?.trim() || null) : sql`atividade_fisica_descricao`},
        observacoes = ${data.observacoes !== undefined ? (data.observacoes?.trim() || null) : sql`observacoes`}
      WHERE id = ${id} AND nutricionista_id = ${nutricionistaId}
      RETURNING 
        id,
        nutricionista_id,
        nome,
        data_nascimento::text,
        sexo,
        telefone,
        whatsapp,
        email,
        peso_inicial::float,
        altura::float,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua::float,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes,
        created_at::text
    `
    return rows[0] as Paciente
  } catch (error) {
    console.error('Erro ao atualizar paciente no Neon:', error)
    throw error
  }
}

export interface Consulta {
  id: string
  paciente_id: string
  data_consulta: string
  peso?: number | null
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
  created_at: string
}

export interface ConsultaInput {
  paciente_id: string
  data_consulta: string
  peso?: number | null
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
}

/**
 * Busca o histórico de consultas de um paciente em ordem cronológica decrescente
 */
export async function getConsultasByPaciente(pacienteId: string): Promise<Consulta[]> {
  try {
    const rows = await sql`
      SELECT 
        id,
        paciente_id,
        data_consulta::text,
        peso::float,
        cintura::float,
        quadril::float,
        percentual_gordura::float,
        observacoes,
        proximo_retorno::text,
        created_at::text
      FROM consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta DESC, created_at DESC
    `
    return rows as Consulta[]
  } catch (error) {
    console.error('Erro ao buscar consultas no Neon:', error)
    return []
  }
}

/**
 * Cadastra uma nova consulta para o paciente no Neon
 */
export async function createConsulta(data: ConsultaInput): Promise<Consulta> {
  try {
    const rows = await sql`
      INSERT INTO consultas (
        paciente_id,
        data_consulta,
        peso,
        cintura,
        quadril,
        percentual_gordura,
        observacoes,
        proximo_retorno
      ) VALUES (
        ${data.paciente_id},
        ${data.data_consulta},
        ${data.peso ?? null},
        ${data.cintura ?? null},
        ${data.quadril ?? null},
        ${data.percentual_gordura ?? null},
        ${data.observacoes?.trim() || null},
        ${data.proximo_retorno || null}
      )
      RETURNING 
        id,
        paciente_id,
        data_consulta::text,
        peso::float,
        cintura::float,
        quadril::float,
        percentual_gordura::float,
        observacoes,
        proximo_retorno::text,
        created_at::text
    `
    return rows[0] as Consulta
  } catch (error) {
    console.error('Erro ao cadastrar consulta no Neon:', error)
    throw error
  }
}

export interface PlanoAlimentar {
  id: string
  paciente_id: string
  conteudo: any
  created_at: string
}

export interface PlanoAlimentarInput {
  paciente_id: string
  conteudo: any
}

/**
 * Busca o histórico de planos alimentares do paciente em ordem decrescente
 */
export async function getPlanosAlimentaresByPaciente(pacienteId: string): Promise<PlanoAlimentar[]> {
  try {
    const rows = await sql`
      SELECT 
        id,
        paciente_id,
        conteudo,
        created_at::text
      FROM planos_alimentares
      WHERE paciente_id = ${pacienteId}
      ORDER BY created_at DESC
    `
    return rows as PlanoAlimentar[]
  } catch (error) {
    console.error('Erro ao buscar planos alimentares no Neon:', error)
    return []
  }
}

/**
 * Cadastra um novo plano alimentar no Neon
 */
export async function createPlanoAlimentar(data: PlanoAlimentarInput): Promise<PlanoAlimentar> {
  try {
    const rows = await sql`
      INSERT INTO planos_alimentares (
        paciente_id,
        conteudo
      ) VALUES (
        ${data.paciente_id},
        ${typeof data.conteudo === 'string' ? data.conteudo : JSON.stringify(data.conteudo)}
      )
      RETURNING 
        id,
        paciente_id,
        conteudo,
        created_at::text
    `
    return rows[0] as PlanoAlimentar
  } catch (error) {
    console.error('Erro ao cadastrar plano alimentar no Neon:', error)
    throw error
  }
}

