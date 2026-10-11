import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const userProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      created_at: (user as any).createdAt,
      updated_at: (user as any).updatedAt,
    };
    res.status(201).json({ token, user: userProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    const userProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      created_at: (user as any).createdAt,
      updated_at: (user as any).updatedAt,
    };
    res.status(200).json({ token, user: userProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', auth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      created_at: (user as any).createdAt,
      updated_at: (user as any).updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

