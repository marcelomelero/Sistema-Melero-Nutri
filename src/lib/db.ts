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

