import express from "express";
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  checkMachineBookings,
} from "../controllers/machine.controller.js";

const router = express.Router();

// GET alle maskiner
router.get("/", getMachines);

// GET en specifik maskine
router.get("/:id", getMachineById);

// POST opret ny maskine
router.post("/", createMachine);

// PUT opdater maskine
router.put("/:id", updateMachine);

// GET tjek bookinger før sletning
router.get("/:id/check-bookings", checkMachineBookings);

// DELETE slet maskine
router.delete("/:id", deleteMachine);

export default router;
