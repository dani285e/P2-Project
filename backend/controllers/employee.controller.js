import Employee from "../models/employee.model.js";
import Booking from "../models/booking.model.js";
import mongoose from "mongoose";

// Hent alle medarbejdere
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error("Error in getting employees: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Hent en enkelt medarbejder via ID
export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid employee ID" });
  }

  try {
    const employee = await Employee.findById(id);

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error("Error in getting employee by ID: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Opret ny medarbejder
export const createEmployee = async (req, res) => {
  const employee = req.body;
  if (!employee.employeeNumber || !employee.name) {
    return res.status(400).json({
      success: false,
      message: "Employee number and name are required",
    });
  }

  try {
    // Tjek om medarbejdernummer allerede eksisterer
    const existingEmployee = await Employee.findOne({
      employeeNumber: employee.employeeNumber,
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee with this number already exists",
      });
    }

    const newEmployee = new Employee(employee);
    await newEmployee.save();
    res.status(201).json({ success: true, employee: newEmployee });
  } catch (error) {
    console.error("Error in creating employee: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Opdater en medarbejder
export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const employee = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid employee ID" });
  }

  try {
    // Hvis medarbejdernummeret ændres, tjek om det nye nummer allerede er i brug
    if (employee.employeeNumber) {
      const existingEmployee = await Employee.findOne({
        employeeNumber: employee.employeeNumber,
        _id: { $ne: id }, // Ekskluder den nuværende medarbejder
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Another employee with this number already exists",
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(id, employee, {
      new: true,
    });

    if (!updatedEmployee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    console.error("Error in updating employee: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Slet en medarbejder
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid employee ID" });
  }

  try {
    // Tjek først om medarbejderen eksisterer
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Tjek om medarbejderen er tilknyttet bookinger
    const bookingsUsingEmployee = await Booking.find({
      employeeIDs: id,
    });

    if (bookingsUsingEmployee.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Kan ikke slette medarbejderen, da denne er tilknyttet eksisterende bookinger",
        count: bookingsUsingEmployee.length,
        bookings: bookingsUsingEmployee.map((b) => b.bookingID),
      });
    }

    // Hvis medarbejderen ikke er tilknyttet bookinger, kan vi slette den
    await Employee.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error in deleting employee: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
