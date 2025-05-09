import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema({
  selected: { type: Boolean, default: false },
  date: { type: Date },
});

const projectSchema = new mongoose.Schema(
  {
    projectID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    customer: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    deadline: { type: Date, required: true },
    price: { type: Number, required: true },
    isClassProject: { type: Boolean, default: false },
    inspections: {
      firstInspection: { type: inspectionSchema, default: () => ({}) },
      wpsWpqr: { type: inspectionSchema, default: () => ({}) },
      ndt: { type: inspectionSchema, default: () => ({}) },
      finalInspection: { type: inspectionSchema, default: () => ({}) },
      report: { type: inspectionSchema, default: () => ({}) },
    },
  },
  { timestamps: true } //createdAt and updatedAt
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
