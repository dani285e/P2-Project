import Project from "../models/project.model.js";
import Booking from "../models/booking.model.js";
import mongoose from "mongoose";
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({});
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("Error in getting projects: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getProjectById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid project ID" });
  }

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Error in getting project by ID: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createProject = async (req, res) => {
  const project = req.body; //user will send the project data
  if (
    !project.name ||
    !project.customer ||
    !project.startDate ||
    !project.deadline ||
    !project.price
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  const newProject = new Project(project);
  try {
    await newProject.save();
    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error("Error in creating project: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const project = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid project ID" });
  }
  try {
    const updatedProject = await Project.findByIdAndUpdate(id, project, {
      new: true,
    });
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    console.error("Error in updating project: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid project ID" });
  }
  try {
    const bookingsUsingProject = await Booking.find({ projectID: id });

    if (bookingsUsingProject.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Kan ikke slette projektet, da det bruges i eksisterende bookinger",
        count: bookingsUsingProject.length,
        bookings: bookingsUsingProject.map((b) => b.bookingID),
      });
    }

    await Project.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error in deleting project: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
