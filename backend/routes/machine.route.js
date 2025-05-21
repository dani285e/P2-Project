import express from "express";
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  checkMachineBookings,
  updateMachineOrder,
} from "../controllers/machine.controller.js";

const router = express.Router();

// GET alle maskiner
router.get("/", getMachines);

// POST opret ny maskine
router.post("/", createMachine);

// POST opdater maskine rækkefølge (skal være før /:id routes)
router.post("/order", updateMachineOrder);

// GET en specifik maskine
router.get("/:id", getMachineById);

// PUT opdater maskine
router.put("/:id", updateMachine);

// GET tjek bookinger før sletning
router.get("/:id/check-bookings", checkMachineBookings);

// DELETE slet maskine
router.delete("/:id", deleteMachine);

export default router;
