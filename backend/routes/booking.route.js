import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  updateAllMachineStatuses,
} from "../controllers/booking.controller.js";

const router = express.Router();

// GET alle bookinger
router.get("/", getBookings);

// GET enkelt booking ved ID
router.get("/:id", getBookingById);

// POST ny booking
router.post("/", createBooking);

// PUT opdater booking
router.put("/:id", updateBooking);

// DELETE slet booking
router.delete("/:id", deleteBooking);

// POST opdater alle maskiners status
router.post("/update-machine-statuses", updateAllMachineStatuses);

export default router;
