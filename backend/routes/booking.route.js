import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/booking.controller.js";

const router = express.Router();

// GET all bookings
router.get("/", getBookings);

// GET single booking by ID
router.get("/:id", getBookingById);

// POST new booking
router.post("/", createBooking);

// PUT update booking
router.put("/:id", updateBooking);

// DELETE delete booking
router.delete("/:id", deleteBooking);

export default router;
