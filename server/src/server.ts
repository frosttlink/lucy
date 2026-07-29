import { fastifyCors } from '@fastify/cors'
import { fastifyRateLimit } from '@fastify/rate-limit'
import { fastifySwagger } from '@fastify/swagger'
import { fastifyWebsocket } from '@fastify/websocket'
import ScalarApiReference from '@scalar/fastify-api-reference'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { env } from './env'
import { appContext } from './lib/app-context'
import { GroqProvider } from './lib/llm/groq'
import { CalculatorTool } from './lib/tools/calculator'
import { Engine } from './lib/tools/engine'
import { NotesTool } from './lib/tools/notes'
import { TasksTool } from './lib/tools/tasks'
import { WeatherTool } from './lib/tools/weather'
import { WebSearchTool } from './lib/tools/websearch'
import { WsHub } from './lib/ws'
import { authLogin } from './routes/auth-login'
import { authRefresh } from './routes/auth-refresh'
import { authRegister } from './routes/auth-register'
import { chatStream } from './routes/chat-stream'
import { createConversation } from './routes/create-conversation'
import { deleteConversation } from './routes/delete-conversation'
import { deleteMemory } from './routes/delete-memory'
import { getMe } from './routes/get-me'
import { getMessages } from './routes/get-messages'
import { health } from './routes/health'
import { listConversations } from './routes/list-conversations'
import { listMemories } from './routes/list-memories'
import { updateMe } from './routes/update-me'
import { voice } from './routes/voice'
import { ChatService } from './services/chat'

const app = fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
}).withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

// Rate limiting
app.register(fastifyRateLimit, {
  max: env.NODE_ENV === 'production' ? 100 : 1000,
  timeWindow: '1 minute',
})

// CORS
app.register(fastifyCors, {
  origin: env.CORS_ORIGIN === '*' ? true : [env.CORS_ORIGIN],
  credentials: true,
})

// Swagger
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Lucy API',
      description: 'AI tutoring assistant for ENEM preparation',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(ScalarApiReference, { routePrefix: '/docs' })

// WebSocket
app.register(fastifyWebsocket)

// Initialize services
const wsHub = new WsHub()
const groqProvider = new GroqProvider(
  env.GROQ_API_KEY,
  env.GEMINI_API_KEY || '',
)
const toolEngine = new Engine()

toolEngine.register(new WebSearchTool())
toolEngine.register(new CalculatorTool())
toolEngine.register(new NotesTool())
toolEngine.register(new TasksTool())
toolEngine.register(new WeatherTool())

const chatService = new ChatService(groqProvider, toolEngine, wsHub)

wsHub.onMessage((userId, msg) => {
  chatService.handleMessage(userId, msg)
})

appContext.wsHub = wsHub
appContext.chatService = chatService

// Routes
app.register(health)
app.register(authRegister)
app.register(authLogin)
app.register(authRefresh)
app.register(getMe)
app.register(updateMe)
app.register(listConversations)
app.register(createConversation)
app.register(deleteConversation)
app.register(getMessages)
app.register(chatStream)
app.register(listMemories)
app.register(deleteMemory)
app.register(voice)

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info({ signal }, 'Received signal, shutting down gracefully')
    await app.close()
    process.exit(0)
  })
}

// Startup
app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  app.log.info(`Lucy API running on http://localhost:${env.PORT}`)
  app.log.info(`Docs available at http://localhost:${env.PORT}/docs`)
})
