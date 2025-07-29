// src/routes/users.js
import express from 'express';
import { getUsersOverview, getUsersGrowth, getAllUsers, getUserById, createUser, updateUser, deleteUser, setUserAdminVerified } from '../controllers/usersController.js';
const router = express.Router();

router.get('/overview', getUsersOverview);
router.get('/growth', getUsersGrowth);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/verify', setUserAdminVerified);
router.delete('/:id', deleteUser);

export default router;
