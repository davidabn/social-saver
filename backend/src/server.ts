import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import * as helmetModule from 'helmet'
import * as rateLimitModule from 'express-rate-limit'

const helmet = (helmetModule as any).default || helmetModule
const rateLimit = (rateLimitModule as any).default || rateLimitModule

import authRoutes from './routes/auth.routes.js'
import contentsRoutes from './routes/contents.routes.js'
import proxyRoutes from './routes/proxy.routes.js'
import webhookRoutes from './routes/webhook.routes.js'
import collectionsRoutes from './routes/collections.routes.js'
import aiRoutes from './routes/ai.routes.js'
import carouselRoutes from './routes/carousel.routes.js'
import fontsRoutes from './routes/fonts.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT ?? 3001

// Security middleware
app.use(helmet())

// CORS configuration
// CORS configuration
app.use(cors({
  origin: true, // Allow all origins by reflecting the origin header
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'TooManyRequests', message: 'Too many requests, please try again later.' }
})
app.use(limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.text({ limit: '10mb' })) // Support text/plain for webhook
app.use(express.urlencoded({ extended: true, limit: '10mb' })) // Support form data

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/contents', contentsRoutes)
app.use('/api/proxy', proxyRoutes)
app.use('/api/webhook', webhookRoutes)
app.use('/api/collections', collectionsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/carousel', carouselRoutes)
app.use('/api/fonts', fontsRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
// Start server if not running in Vercel (Vercel exports the app)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`)
    console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`)
  })
}

export default app
