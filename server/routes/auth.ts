import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body as { password?: string };
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    res.status(500).json({ error: 'Server not configured (APP_PASSWORD missing)' });
    return;
  }

  if (!password || password !== expected) {
    res.status(401).json({ error: 'Helytelen jelszó' });
    return;
  }

  const token = jwt.sign({ auth: true }, getJwtSecret(), { expiresIn: '30d' });
  res.json({ token });
});

export default router;
