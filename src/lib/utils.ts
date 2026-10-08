import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata telefone / WhatsApp no padrão brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Converte entradas numéricas ou livres para formato de hora HH:mm
 * Exemplos:
 *  - "6"    -> "06:00"
 *  - "630"  -> "06:30"
 *  - "23"   -> "23:00"
 *  - "2230" -> "22:30"
 *  - "7:30" -> "07:30"
 */
export function formatTimeInput(input: string): string {
  if (!input) return ''
  const trimmed = input.trim()

  // Se já contém :, valida e formata com dois dígitos
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    const h = parseInt(parts[0] || '0', 10)
    const m = parseInt(parts[1] || '0', 10)
    if (isNaN(h)) return ''
    const safeH = Math.min(Math.max(h, 0), 23).toString().padStart(2, '0')
    const safeM = Math.min(Math.max(isNaN(m) ? 0 : m, 0), 59).toString().padStart(2, '0')
    return `${safeH}:${safeM}`
  }

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.length === 1 || digits.length === 2) {
    const hour = parseInt(digits, 10)
    const safeH = Math.min(Math.max(hour, 0), 23).toString().padStart(2, '0')
    return `${safeH}:00`
  }

  if (digits.length === 3) {
    const hour = parseInt(digits.slice(0, 1), 10)
    const min = parseInt(digits.slice(1), 10)
    const safeH = Math.min(Math.max(hour, 0), 23).toString().padStart(2, '0')
    const safeM = Math.min(Math.max(min, 0), 59).toString().padStart(2, '0')
    return `${safeH}:${safeM}`
  }

  if (digits.length >= 4) {
    const hour = parseInt(digits.slice(0, 2), 10)
    const min = parseInt(digits.slice(2, 4), 10)
    const safeH = Math.min(Math.max(hour, 0), 23).toString().padStart(2, '0')
    const safeM = Math.min(Math.max(min, 0), 59).toString().padStart(2, '0')
    return `${safeH}:${safeM}`
  }

  return trimmed
}

/**
 * Calcula idade a partir da data de nascimento (YYYY-MM-DD)
 */
export function calculateAge(birthDate: string): { years: number; text: string } | null {
  if (!birthDate) return null
  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || !month || !day) return null

  const birth = new Date(year, month - 1, day)
  if (isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  if (age < 0 || isNaN(age)) return null
  return {
    years: age,
    text: `${age} ${age === 1 ? 'ano' : 'anos'}`,
  }
}

export interface IMCResult {
  value: number
  formatted: string
  classification: string
  color: string
  bg: string
  badge: string
}

/**
 * Calcula IMC a partir do peso (kg) e altura (cm ou m)
 */
export function calculateIMC(weightKg: number | string, heightInput: number | string): IMCResult | null {
  const weight = typeof weightKg === 'string' ? parseFloat(weightKg.replace(',', '.')) : weightKg
  const heightVal = typeof heightInput === 'string' ? parseFloat(heightInput.replace(',', '.')) : heightInput

  if (!weight || !heightVal || weight <= 0 || heightVal <= 0) return null

  // Se a altura for maior que 3, assumimos que está em cm (ex: 175), senão em m (ex: 1.75)
  const heightM = heightVal > 3 ? heightVal / 100 : heightVal
  const imc = weight / (heightM * heightM)

  if (isNaN(imc) || !isFinite(imc) || imc <= 0) return null

  let classification = ''
  let color = ''
  let bg = ''
  let badge = ''

  if (imc < 18.5) {
    classification = 'Abaixo do peso'
    color = 'text-blue-700'
    bg = 'bg-blue-50 border-blue-200'
    badge = 'bg-blue-100 text-blue-800'
  } else if (imc < 25.0) {
    classification = 'Peso normal (Eutrofia)'
    color = 'text-emerald-700'
    bg = 'bg-emerald-50 border-emerald-200'
    badge = 'bg-emerald-100 text-emerald-800'
  } else if (imc < 30.0) {
    classification = 'Sobrepeso'
    color = 'text-amber-700'
    bg = 'bg-amber-50 border-amber-200'
    badge = 'bg-amber-100 text-amber-800'
  } else if (imc < 35.0) {
    classification = 'Obesidade Grau I'
    color = 'text-orange-700'
    bg = 'bg-orange-50 border-orange-200'
    badge = 'bg-orange-100 text-orange-800'
  } else if (imc < 40.0) {
    classification = 'Obesidade Grau II'
    color = 'text-rose-700'
    bg = 'bg-rose-50 border-rose-200'
    badge = 'bg-rose-100 text-rose-800'
  } else {
    classification = 'Obesidade Grau III (Mórbida)'
    color = 'text-red-800'
    bg = 'bg-red-50 border-red-300'
    badge = 'bg-red-100 text-red-800'
  }

  return {
    value: Number(imc.toFixed(1)),
    formatted: imc.toFixed(1),
    classification,
    color,
    bg,
    badge,
  }
}

/**
 * Formata data ISO ou string para padrão brasileiro DD/MM/AAAA
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return 'Não informada'
  try {
    const cleanStr = dateStr.split('T')[0]
    const [y, m, d] = cleanStr.split('-')
    if (y && m && d) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
    }
    return new Date(dateStr).toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}
