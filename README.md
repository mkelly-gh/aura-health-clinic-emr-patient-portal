# Cloudflare AI Chat Application

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mkelly-gh/aura-health-clinic-emr-patient-portal)

A production-ready, full-stack AI chat application built on Cloudflare Workers. Features multi-session conversations, streaming responses, tool calling (web search, weather, MCP integration), and model switching. The frontend is a responsive React app with shadcn/ui components, while the backend leverages Cloudflare Durable Objects and Agents SDK for stateful chat sessions.

## ✨ Key Features

- **Multi-Session Management**: Persistent chat sessions with titles, timestamps, and activity tracking.
- **Streaming Responses**: Real-time message streaming for natural conversation flow.
- **Tool Calling**: Built-in tools for web search (SerpAPI), weather, and extensible MCP (Model Context Protocol) tools.
- **Model Flexibility**: Switch between models like Gemini 2.5 Flash/Pro via Cloudflare AI Gateway.
- **Session Controls**: Create, list, update, delete sessions; clear all sessions.
- **Responsive UI**: Modern design with Tailwind CSS, dark/light themes, and mobile support.
- **Production-Ready**: TypeScript, error handling, CORS, logging, and Cloudflare observability.
- **Extensible**: Easy to add custom routes, tools, and UI components.

## 🛠️ Tech Stack

- **Backend**: Cloudflare Workers, Durable Objects (ChatAgent, AppController), Hono, Agents SDK, OpenAI SDK
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Tanstack Query, React Router
- **AI Integration**: Cloudflare AI Gateway, Gemini models, SerpAPI, MCP SDK
- **Utilities**: Zod validation, Framer Motion, Sonner toasts, Lucide icons
- **Build Tools**: Bun, Wrangler, Vite

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone <your-repo>
   cd <your-repo>
   bun install
   ```

2. **Configure Environment** (via `wrangler.jsonc` or CLI)
   Update `wrangler.jsonc` vars:
   ```
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
     "CF_AI_API_KEY": "{your_ai_gateway_key}",
     "SERPAPI_KEY": "{your_serpapi_key}",
     "OPENROUTER_API_KEY": "{optional_openrouter_key}"
   }
   ```

3. **Development**
   ```bash
   bun dev
   ```
   Opens at `http://localhost:3000` (or `$PORT`).

4. **Type Generation**
   ```bash
   bun run cf-typegen  # Generates Worker types
   ```

## 🧪 Development Workflow

- **Hot Reload**: `bun dev` auto-reloads frontend and proxies Worker API.
- **Linting**: `bun lint`
- **Build**: `bun build` (produces `dist/` for preview).
- **Preview**: `bun preview`
- **Worker Types**: Run `bun run cf-typegen` after Worker changes.
- **Custom Routes**: Add to `worker/userRoutes.ts`.
- **New Tools**: Extend `worker/tools.ts` or MCP servers in `worker/mcp-client.ts`.
- **UI Components**: Use shadcn/ui via `components.json`; add pages to `src/pages/`.

API Endpoints (proxied via `/api/`):
- `POST /api/chat/:sessionId/chat` - Send message
- `GET /api/chat/:sessionId/messages` - Get state
- `DELETE /api/chat/:sessionId/clear` - Clear chat
- `POST /api/chat/:sessionId/model` - Update model
- `/api/sessions` - Manage sessions (list, create, delete, etc.)

## ☁️ Deployment

Deploy to Cloudflare Workers with full-stack support (static assets + Worker):

1. **Configure Wrangler**
   - Login: `npx wrangler login`
   - Set secrets: `wrangler secret put CF_AI_API_KEY` (etc.)
   - Update `wrangler.jsonc` with your account/gateway IDs.

2. **Deploy**
   ```bash
   bun run deploy  # Builds + deploys
   ```
   Or manually:
   ```bash
   bun build
   npx wrangler deploy
   ```

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mkelly-gh/aura-health-clinic-emr-patient-portal)

Your app will be live at `<your-subdomain>.workers.dev` with automatic SPA routing.

**Pro Tips**:
- Enable observability in `wrangler.jsonc`.
- Use migrations for Durable Objects.
- Preview with `wrangler pages dev dist`.

## 🔧 Environment Variables

Required:
| Var | Description | Example |
|-----|-------------|---------|
| `CF_AI_BASE_URL` | Cloudflare AI Gateway endpoint | `https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/openai` |
| `CF_AI_API_KEY` | AI Gateway API key | `your-gateway-key` |
| `SERPAPI_KEY` | SerpAPI key for web search | `your-serpapi-key` |

Optional: `OPENROUTER_API_KEY` for additional models.

## 🤝 Contributing

1. Fork & clone.
2. `bun install`.
3. Create feature branch: `bun dev`.
4. PR with clear description.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙌 Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Agents SDK](https://developers.cloudflare.com/agents/)
- Issues: [GitHub Issues](https://github.com/<your-username>/<your-repo>/issues)