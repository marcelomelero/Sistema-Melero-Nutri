import { Leaf } from 'lucide-react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-7 h-7',
      text: 'text-lg',
      sub: 'text-[10px]',
    },
    md: {
      icon: 'w-9 h-9',
      text: 'text-2xl',
      sub: 'text-xs',
    },
    lg: {
      icon: 'w-12 h-12',
      text: 'text-3xl',
      sub: 'text-sm',
    },
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/25 p-2 transition-transform hover:scale-105">
        <Leaf className={`${currentSize.icon}`} />
      </div>
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-tight text-slate-800 ${currentSize.text}`}>
          Sistema <span className="text-emerald-600">Melero Nutri</span>
        </span>
        <span className={`font-medium tracking-wider text-slate-400 uppercase ${currentSize.sub}`}>
          Plataforma de Nutrição Clínica
        </span>
      </div>
    </div>
  )
}
