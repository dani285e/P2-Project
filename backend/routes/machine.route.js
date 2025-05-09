import express from "express";
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} from "../controllers/machine.controller.js";

const router = express.Router();

// GET alle maskiner
router.get("/", getMachines);

// GET en enkelt maskine efter ID
router.get("/:id", getMachineById);

// POST ny maskine
router.post("/", createMachine);

// PUT opdater maskine
router.put("/:id", updateMachine);

// DELETE slet maskine
router.delete("/:id", deleteMachine);

export default router;
