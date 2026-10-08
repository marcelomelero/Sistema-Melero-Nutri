import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { gerarPlanoHandler } from "./api/gerar-plano"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      react(),
      {
        name: "api-gerar-plano-plugin",
        configureServer(server) {
          server.middlewares.use("/api/gerar-plano", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify({ error: "Método não permitido" }))
              return
            }

            let body = ""
            req.on("data", (chunk: any) => {
              body += chunk
            })

            req.on("end", async () => {
              try {
                const parsed = JSON.parse(body || "{}")
                const paciente = parsed.paciente || parsed
                const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

                const plano = await gerarPlanoHandler(paciente, apiKey)
                res.statusCode = 200
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(plano))
              } catch (err: any) {
                console.error("Erro na API gerar-plano dev server:", err)
                res.statusCode = 500
                res.setHeader("Content-Type", "application/json")
                res.end(
                  JSON.stringify({
                    error: err?.message || "Erro ao processar plano com Gemini IA.",
                  })
                )
              }
            })
          })
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
