import mongoose from "mongoose";

// Schema for employees
const employeeSchema = new mongoose.Schema(
  {
    employeeNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    skills: [{ type: String }], // Array of skills as strings
  },
  { timestamps: true } // createdAt and updatedAt are added automatically
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
