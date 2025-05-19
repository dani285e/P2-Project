import express from "express";
import Project from "../models/project.model.js";
import mongoose from "mongoose";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  checkProjectBookings,
} from "../controllers/project.controller.js";
const router = express.Router();

export default router;

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", createProject);
router.put("/:id", updateProject);
router.get("/:id/check-bookings", checkProjectBookings);
router.delete("/:id", deleteProject);
