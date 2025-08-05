// src/routes/users.js
import express from 'express';
import { getUsersOverview, getUsersGrowth, getAllUsers, getUserById, createUser, updateUser, deleteUser, setUserAdminVerified, getUserDetails } from '../controllers/usersController.js';
import { protect } from '../middleware/auth.middleware.js';
const router = express.Router();

router.get('/overview', getUsersOverview);
router.get('/growth', getUsersGrowth);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', protect, updateUser);
router.put('/:id/verify', protect, setUserAdminVerified);
router.delete('/:id', protect, deleteUser);
 

export default router;
