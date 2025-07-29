    // backend/src/api/users/user.routes.js
    import { Router } from 'express';
    import { getAllUsers, approveUser } from './user.controller.js';
    const router = Router();

    // Route: GET /api/users
    router.get('/', getAllUsers);

    // Route: PUT /api/users/:id/approve
    router.put('/:id/approve', approveUser);

    export default router;
    