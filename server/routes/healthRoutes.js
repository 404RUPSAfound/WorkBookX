import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'workbookx-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;
