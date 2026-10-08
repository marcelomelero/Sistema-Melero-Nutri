import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

export const config = {
  maxDuration: 60,
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Plano alimentar para cada dia da semana (Segunda a Domingo)',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: { type: SchemaType.STRING },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções de alimentos ou porções para o café da manhã',
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções de alimentos ou porções para o lanche da manhã',
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções de alimentos ou porções para o almoço',
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções de alimentos ou porções para o lanche da tarde',
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções de alimentos ou porções para o jantar',
              },
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar'],
          },
        },
        required: ['dia', 'refeicoes'],
      },
    },
  },
  required: ['plano_semanal'],
}

export async function gerarPlanoHandler(pacienteData: any, apiKey?: string) {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY || ''

  if (!geminiKey) {
    throw new Error('Chave da API Gemini (GEMINI_API_KEY) não configurada no servidor.')
  }

  const genAI = new GoogleGenerativeAI(geminiKey)

  // Prepara resumo estruturado dos dados do paciente para o prompt
  const dadosFormatados = `
- Nome: ${pacienteData.nome || 'Não informado'}
- Idade / Data Nasc: ${pacienteData.data_nascimento || 'Não informado'}
- Sexo: ${pacienteData.sexo || 'Não informado'}
- Peso Atual: ${pacienteData.peso_inicial ? `${pacienteData.peso_inicial} kg` : 'Não informado'}
- Altura: ${pacienteData.altura ? `${pacienteData.altura} cm` : 'Não informado'}
- Objetivos Principais: ${
    Array.isArray(pacienteData.objetivos) && pacienteData.objetivos.length > 0
      ? pacienteData.objetivos.join(', ')
      : pacienteData.objetivo_texto || 'Saúde geral'
  } ${pacienteData.objetivo_texto ? `(${pacienteData.objetivo_texto})` : ''}
- Nível de Atividade Física: ${pacienteData.nivel_atividade || 'Sedentário'}
- Pratica Atividade Física: ${
    pacienteData.atividade_fisica ? `Sim - ${pacienteData.atividade_fisica_descricao || 'Geral'}` : 'Não'
  }
- Patologias / Condições: ${
    Array.isArray(pacienteData.patologias) && pacienteData.patologias.length > 0
      ? pacienteData.patologias.join(', ')
      : 'Nenhuma'
  }
- Restrições Alimentares: ${
    Array.isArray(pacienteData.restricoes_alimentares) && pacienteData.restricoes_alimentares.length > 0
      ? pacienteData.restricoes_alimentares.join(', ')
      : 'Nenhuma'
  }
- Alergias Alimentares: ${
    Array.isArray(pacienteData.alergias) && pacienteData.alergias.length > 0
      ? pacienteData.alergias.join(', ')
      : 'Nenhuma'
  }
- Medicamentos em uso: ${pacienteData.medicamentos || 'Nenhum'}
- Suplementos em uso: ${pacienteData.suplementos || 'Nenhum'}
- Refeições por dia habituais: ${pacienteData.refeicoes_por_dia || 'Não informado'}
- Rotina de Horários: Acorda às ${pacienteData.horario_acorda || '07:00'}, dorme às ${
    pacienteData.horario_dorme || '23:00'
  }
- Ingestão de Água: ${pacienteData.litros_agua ? `${pacienteData.litros_agua} L/dia` : 'Não informado'}
- Observações Clínicas Adicionais: ${pacienteData.observacoes || 'Nenhuma'}
`.trim()

  const prompt = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`.trim()

  // Tenta modelos disponíveis com structured outputs
  const candidateModels = [
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash',
    'gemini-flash-latest',
  ]
  let lastError: any = null

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
          temperature: 0.7,
        },
      })

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // Validação de JSON seguro
      let parsed = JSON.parse(responseText)

      // Garante que o retorno contenha a chave plano_semanal
      if (parsed && parsed.plano_semanal && Array.isArray(parsed.plano_semanal)) {
        return parsed
      }

      if (Array.isArray(parsed)) {
        return { plano_semanal: parsed }
      }

      return parsed
    } catch (err: any) {
      console.warn(`Tentativa com modelo ${modelName} falhou:`, err?.message || err)
      lastError = err
    }
  }

  throw lastError || new Error('Não foi possível gerar o plano alimentar estruturado com a IA.')
}

// Serverless Handler (Padrão Vercel / Node)
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const paciente = body?.paciente || body

    if (!paciente || !paciente.nome) {
      return res.status(400).json({ error: 'Dados do paciente incompletos.' })
    }

    const plano = await gerarPlanoHandler(paciente)
    return res.status(200).json(plano)
  } catch (error: any) {
    console.error('Erro na rota /api/gerar-plano:', error)
    return res.status(500).json({
      error: error?.message || 'Erro interno ao processar geração com Gemini IA.',
    })
  }
}
