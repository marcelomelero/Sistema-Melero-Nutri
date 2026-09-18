import React, { createContext, useContext, useState, useEffect } from 'react'
import { syncNutricionista } from '@/lib/db'

export interface User {
  id: string
  name: string
  email: string
  image?: string | null
}

export interface Session {
  id: string
  userId: string
  token?: string
  expiresAt?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_BASE_URL = import.meta.env.VITE_NEON_AUTH_URL || ''
const LOCAL_STORAGE_USER_KEY = 'melero_nutri_user'
const LOCAL_STORAGE_SESSION_KEY = 'melero_nutri_session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Carregar sessão existente ao iniciar
  useEffect(() => {
    async function checkSession() {
      try {
        // Tentar obter do Neon Auth via cookie / get-session
        const res = await fetch(`${AUTH_BASE_URL}/get-session`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })

        if (res.ok) {
          const data = await res.json()
          if (data && data.user) {
            setUser(data.user)
            setSession(data.session || null)
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user))
            if (data.session) {
              localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(data.session))
            }
            setIsLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('Verificação de sessão via API falhou, tentando cache local:', err)
      }

      // Fallback para localStorage para manter sessão ativa caso cookies cross-domain tenham restrições
      const cachedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY)
      const cachedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY)
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser))
          if (cachedSession) setSession(JSON.parse(cachedSession))
        } catch {
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
          localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
        }
      }
      setIsLoading(false)
    }

    checkSession()
  }, [])

  // Login de usuário
  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${AUTH_BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        let msg = 'Erro ao realizar login. Verifique seu email e senha.'
        if (data.message) {
          if (data.message.toLowerCase().includes('invalid email or password') || data.message.toLowerCase().includes('invalid credentials')) {
            msg = 'Email ou senha incorretos. Por favor, tente novamente.'
          } else if (data.message.toLowerCase().includes('user not found')) {
            msg = 'Nenhum nutricionista encontrado com este email.'
          } else {
            msg = data.message
          }
        }
        return { error: msg }
      }

      const loggedUser = data.user || {
        id: data.id || 'usr_' + Date.now(),
        name: data.name || email.split('@')[0],
        email: email.trim(),
      }
      const loggedSession = data.session || {
        id: 'sess_' + Date.now(),
        userId: loggedUser.id,
      }

      setUser(loggedUser)
      setSession(loggedSession)
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(loggedUser))
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(loggedSession))

      // Sincroniza com a tabela nutricionistas se necessário
      try {
        await syncNutricionista(loggedUser.name || email.split('@')[0], loggedUser.email)
      } catch (syncErr) {
        console.warn('Aviso: falha na sincronização secundária da tabela nutricionistas:', syncErr)
      }

      return {}
    } catch (err: any) {
      console.error('Erro na requisição de login:', err)
      return { error: 'Não foi possível conectar ao servidor de autenticação. Verifique sua conexão.' }
    }
  }

  // Cadastro de usuário
  const register = async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${AUTH_BASE_URL}/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        let msg = 'Erro ao realizar cadastro.'
        if (data.message) {
          if (data.message.toLowerCase().includes('user already exists') || data.message.toLowerCase().includes('already registered')) {
            msg = 'Este email já está cadastrado. Tente fazer login.'
          } else if (data.message.toLowerCase().includes('password')) {
            msg = 'A senha informada não atende aos requisitos mínimos.'
          } else {
            msg = data.message
          }
        }
        return { error: msg }
      }

      const newUser = data.user || {
        id: data.id || 'usr_' + Date.now(),
        name: name.trim(),
        email: email.trim(),
      }
      const newSession = data.session || {
        id: 'sess_' + Date.now(),
        userId: newUser.id,
      }

      // Regra importante: Salvar o nome e email na tabela nutricionistas do Neon
      try {
        await syncNutricionista(name.trim(), email.trim())
      } catch (dbErr) {
        console.error('Erro ao registrar na tabela nutricionistas:', dbErr)
      }

      setUser(newUser)
      setSession(newSession)
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser))
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newSession))

      return {}
    } catch (err: any) {
      console.error('Erro na requisição de cadastro:', err)
      return { error: 'Não foi possível conectar ao servidor. Tente novamente mais tarde.' }
    }
  }

  // Logout de usuário
  const logout = async () => {
    try {
      await fetch(`${AUTH_BASE_URL}/sign-out`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.warn('Erro ao efetuar logout na API:', err)
    } finally {
      setUser(null)
      setSession(null)
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY)
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
