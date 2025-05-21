import express from "express";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controller.js";

const router = express.Router();

// Basic CRUD operations
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
