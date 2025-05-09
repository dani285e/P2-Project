import mongoose from "mongoose";

// Schema for medarbejdere
const employeeSchema = new mongoose.Schema(
  {
    employeeNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    skills: [{ type: String }], // Array af færdigheder som strings
  },
  { timestamps: true } // createdAt og updatedAt tilføjes automatisk
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
