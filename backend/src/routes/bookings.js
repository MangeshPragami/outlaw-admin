// src/routes/bookings.js
import express from 'express';
import { 
  getBookingsOverview, 
  getBookingsGrowth, 
  getAllBookings, 
  getBookingById, 
  createBooking, 
  updateBooking, 
  deleteBooking,
  updateBookingStatus,
  getBookingsByStatus,
  getUpcomingBookings,
  getBookingTranscript
} from '../controllers/bookingsController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Analytics routes (no auth needed for overview)
router.get('/overview', getBookingsOverview);
router.get('/growth', getBookingsGrowth);
router.get('/upcoming', getUpcomingBookings);
router.get('/status/:status', getBookingsByStatus);

// CRUD routes (protected)
router.get('/bookings', protect, getAllBookings);
router.get('/:id', protect, getBookingById);
router.post('/', protect, createBooking);
router.put('/:id', protect, updateBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking);
// In routes/bookings.js
router.get('/:id/transcript', protect, getBookingTranscript);

export default router;