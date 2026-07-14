import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import { checkDbConnection, sequelize } from './config/db';
import './models/User';
import './models/Task';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity, can narrow down to frontend dev port later
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health Check / Root route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task-Manager Backend is running' });
});

// Startup Function
const startServer = async () => {
  // Check DB Connection first
  const dbConnected = await checkDbConnection();
  if (!dbConnected) {
    console.warn('⚠️ Warning: Server is starting but database connection failed. Make sure MySQL is running and configuration in .env is correct.');
  } else {
    try {
      await sequelize.sync();
      console.log('✅ Database models synchronized successfully.');
    } catch (err: any) {
      console.error('❌ Database model synchronization failed:', err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Fatal startup error:', err);
});
