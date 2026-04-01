import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import contractRoutes from './routes/contract.routes';
import userRoutes from './routes/user.routes';
import activityLogRoutes from './routes/activityLog.routes';
import clientRoutes from './routes/client.routes';
import path from 'path';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityLogRoutes);
app.use('/api/clients', clientRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
