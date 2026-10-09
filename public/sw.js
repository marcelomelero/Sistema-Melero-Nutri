// Service Worker - Sistema Melero Nutri PWA
const CACHE_NAME = 'melero-nutri-v1.0.0'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/leaf.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
]

// Instalação do Service Worker e pré-cacheamento do app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Aviso ao pré-cachear ativos:', err)
      })
    })
  )
  self.skipWaiting()
})

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Interceptação de requisições de rede
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requisições de esquemas não suportados (ex: chrome-extension)
  if (!url.protocol.startsWith('http')) return

  // Ignora rotas de API dinâmica (/api/...) para garantir dados clínicos frescos
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Requisições de Navegação de Página (HTML) -> Estratégia Network-First com Fallback Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const indexFallback = await caches.match('/index.html')
          if (indexFallback) return indexFallback
          return caches.match('/')
        })
    )
    return
  }

  // Ativos Estáticos (Imagens, Fontes, CSS, JS compilados) -> Estratégia Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})

// Comunicação com a aplicação (ex: forçar ativação após nova versão)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
