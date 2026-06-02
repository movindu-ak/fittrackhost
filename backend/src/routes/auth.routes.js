import express from 'express';
import { register, login, getProfile, getTrainers, registerTrainer, updateProfile, getAdminStats, getMembers } from '../controllers/auth.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/update-profile', protect, updateProfile);
router.get('/trainers', protect, getTrainers);
router.get('/stats', protect, admin, getAdminStats);
router.get('/members', protect, admin, getMembers);
router.post('/register-trainer', protect, admin, registerTrainer);

export default router;

