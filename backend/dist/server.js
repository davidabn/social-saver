import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import contentsRoutes from './routes/contents.routes.js';
import proxyRoutes from './routes/proxy.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
const app = express();
const PORT = process.env.PORT ?? 3001;
// Security middleware
app.use(helmet());
// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'TooManyRequests', message: 'Too many requests, please try again later.' }
});
app.use(limiter);
// Body parsing
app.use(express.json());
app.use(express.text()); // Support text/plain for webhook
app.use(express.urlencoded({ extended: true })); // Support form data
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contents', contentsRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/webhook', webhookRoutes);
// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
});
//# sourceMappingURL=server.js.map