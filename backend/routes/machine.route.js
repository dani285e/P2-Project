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

// GET all machines
router.get("/", getMachines);

// POST create new machine
router.post("/", createMachine);

// POST update machine order (must be before /:id routes)
router.post("/order", updateMachineOrder);

// GET a specific machine
router.get("/:id", getMachineById);

// PUT update machine
router.put("/:id", updateMachine);

// GET check bookings before deletion
router.get("/:id/check-bookings", checkMachineBookings);

// DELETE delete machine
router.delete("/:id", deleteMachine);

export default router;
