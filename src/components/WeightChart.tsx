import { useMemo } from 'react'
import { Consulta } from '@/lib/db'
import { formatDateBR } from '@/lib/utils'
import { TrendingDown, TrendingUp, Minus, Scale, Calendar } from 'lucide-react'

interface WeightChartProps {
  consultas: Consulta[]
  pesoInicial?: number | null
  onNewConsulta?: () => void
}

export function WeightChart({ consultas, pesoInicial, onNewConsulta }: WeightChartProps) {
  // Ordena cronologicamente crescente para o gráfico (da mais antiga para a mais recente)
  const sortedPoints = useMemo(() => {
    // Filtra apenas consultas que tenham peso válido
    const valid = consultas
      .filter((c) => c.peso !== null && c.peso !== undefined && Number(c.peso) > 0)
      .map((c) => ({
        id: c.id,
        date: c.data_consulta,
        weight: Number(c.peso),
        formattedDate: formatDateBR(c.data_consulta),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return valid
  }, [consultas])

  const stats = useMemo(() => {
    if (sortedPoints.length === 0) return null

    const weights = sortedPoints.map((p) => p.weight)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const firstWeight = pesoInicial && pesoInicial > 0 ? pesoInicial : weights[0]
    const lastWeight = weights[weights.length - 1]
    const diff = Number((lastWeight - firstWeight).toFixed(1))

    return {
      minWeight,
      maxWeight,
      firstWeight,
      lastWeight,
      diff,
      totalRegistros: sortedPoints.length,
    }
  }, [sortedPoints, pesoInicial])

  // Se não houver consultas ainda
  if (sortedPoints.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
          <Scale className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Nenhuma consulta registrada ainda</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
          Registre a primeira consulta do paciente para começar a acompanhar o gráfico de evolução de peso e medidas corporais.
        </p>
        {onNewConsulta && (
          <button
            type="button"
            onClick={onNewConsulta}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Registrar Primeira Consulta
          </button>
        )}
      </div>
    )
  }

  // Dimensões do SVG
  const width = 700
  const height = 220
  const paddingX = 50
  const paddingY = 35

  const minW = Math.max(0, (stats?.minWeight || 50) - 2)
  const maxW = (stats?.maxWeight || 100) + 2
  const weightRange = maxW - minW || 1

  const getX = (index: number) => {
    if (sortedPoints.length === 1) return width / 2
    return paddingX + (index / (sortedPoints.length - 1)) * (width - paddingX * 2)
  }

  const getY = (weight: number) => {
    return height - paddingY - ((weight - minW) / weightRange) * (height - paddingY * 2)
  }

  // Gera o caminho da linha SVG
  const pointsString = sortedPoints
    .map((p, idx) => `${getX(idx)},${getY(p.weight)}`)
    .join(' ')

  const pathD = sortedPoints.reduce((acc, p, idx) => {
    const x = getX(idx)
    const y = getY(p.weight)
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
  }, '')

  // Caminho fechado para gradiente de preenchimento
  const areaD = sortedPoints.length > 1
    ? `${pathD} L ${getX(sortedPoints.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`
    : ''

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Cabeçalho do Gráfico com Estatísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            Evolução de Peso
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento histórico dos registros de peso em cada consulta.
          </p>
        </div>

        {stats && (
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Peso Atual</span>
              <span className="text-sm font-extrabold text-slate-900">{stats.lastWeight} kg</span>
            </div>

            <div
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                stats.diff < 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : stats.diff > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {stats.diff < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              ) : stats.diff > 0 ? (
                <TrendingUp className="w-4 h-4 text-blue-600" />
              ) : (
                <Minus className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <span className="text-[10px] uppercase font-bold block opacity-75">Variação Total</span>
                <span className="text-xs font-bold">
                  {stats.diff > 0 ? `+${stats.diff}` : stats.diff} kg
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico SVG com rolagem suave no mobile */}
      <div className="relative w-full overflow-x-auto no-scrollbar touch-pan-x">
        <div className="min-w-[460px] sm:min-w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 sm:h-56">
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Linhas de Grade Horizontais */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + ratio * (height - paddingY * 2)
              const weightVal = (maxW - ratio * weightRange).toFixed(1)
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="inherit"
                    fontWeight="500"
                  >
                    {weightVal}kg
                  </text>
                </g>
              )
            })}

            {/* Preenchimento de Área com Gradiente */}
            {sortedPoints.length > 1 && <path d={areaD} fill="url(#weightGradient)" />}

            {/* Linha Principal do Gráfico */}
            {sortedPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            )}

            {/* Pontos de Dados com Rótulos de Peso e Data */}
            {sortedPoints.map((p, idx) => {
              const cx = getX(idx)
              const cy = getY(p.weight)
              return (
                <g key={p.id || idx} className="group">
                  {/* Linha vertical tracejada do ponto até o eixo X */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx}
                    y2={height - paddingY}
                    stroke="#cbd5e1"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />

                  {/* Círculo de fundo e borda */}
                  <circle cx={cx} cy={cy} r="6" fill="#ffffff" stroke="#059669" strokeWidth="3" />

                  {/* Rótulo com o valor do peso acima do ponto */}
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="inherit"
                  >
                    {p.weight} kg
                  </text>

                  {/* Rótulo com a data no eixo X */}
                  <text
                    x={cx}
                    y={height - paddingY + 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="inherit"
                    fontWeight="500"
                  >
                    {p.formattedDate}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
