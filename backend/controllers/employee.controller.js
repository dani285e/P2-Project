import Employee from "../models/employee.model.js";
import Booking from "../models/booking.model.js";
import mongoose from "mongoose";

// Get all employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error("Error in getting employees: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get a single employee by ID
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

// Create new employee
export const createEmployee = async (req, res) => {
  const employee = req.body;
  if (!employee.employeeNumber || !employee.name) {
    return res.status(400).json({
      success: false,
      message: "Employee number and name are required",
    });
  }

  try {
    // Check if employee number already exists
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

// Update an employee
export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const employee = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid employee ID" });
  }

  try {
    // If employee number is changed, check if the new number is already in use
    if (employee.employeeNumber) {
      const existingEmployee = await Employee.findOne({
        employeeNumber: employee.employeeNumber,
        _id: { $ne: id }, // Exclude the current employee
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

// Delete an employee
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid employee ID" });
  }

  try {
    // First check if the employee exists
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Check if the employee is associated with any bookings
    const bookingsUsingEmployee = await Booking.find({
      employeeIDs: id,
    });

    if (bookingsUsingEmployee.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete the employee as they are associated with existing bookings",
        count: bookingsUsingEmployee.length,
        bookings: bookingsUsingEmployee.map((b) => b.bookingID),
      });
    }

    // If the employee is not associated with any bookings, we can delete them
    await Employee.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error in deleting employee: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
