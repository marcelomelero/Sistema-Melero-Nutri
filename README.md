# Sistema Melero Nutri 🥗

Sistema completo e moderno de gestão nutricional, prontuários, planos alimentares e acompanhamento de pacientes, desenvolvido com React, TypeScript, Tailwind CSS e Neon PostgreSQL / Neon Auth.

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Radix UI
- **Backend / Database**: Neon Serverless PostgreSQL, Neon Auth / Better Auth

## ⚙️ Configuração do Ambiente

1. Clone o repositório:
   ```bash
   git clone https://github.com/marcelomelero/Sistema-Melero-Nutri.git
   cd Sistema-Melero-Nutri
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Duplique o arquivo `.env.example` e renomeie para `.env`
   - Preencha com as credenciais do seu projeto no Neon:
   ```env
   VITE_NEON_AUTH_URL=sua_url_neon_auth
   VITE_NEON_DATABASE_URL=sua_url_neon_database
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔒 Segurança

- Arquivos contendo segredos e credenciais locais (`.env`) são ignorados pelo Git via `.gitignore`.
- Nunca envie credenciais de produção ou strings de conexão de banco de dados diretamente ao repositório público.
