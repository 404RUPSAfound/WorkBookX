import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import comparisonRoutes from './routes/comparisonRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security & CORS configuration
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Request body parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 3. API Routes
app.use('/api', healthRoutes);
app.use('/api', comparisonRoutes);

// 4. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// 5. Global Error Handling Middleware (prevents leaking internal stack traces)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File size limit exceeded. Maximum file size is 15MB.'
    });
  }

  res.status(500).json({
    success: false,
    error: 'An internal server error occurred. Please check server logs.'
  });
});

import { fileURLToPath } from 'url';

// Only listen if running directly as the main CLI entry point (e.g. node server.js)
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('server.js')
);

if (isMain) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`WorkbookX Server running on http://127.0.0.1:${PORT}`);
  });
}

export default app;
