import Booking from "../models/booking.model.js";
import Machine from "../models/machine.model.js";

// Helper function to update machine status based on current bookings
const updateMachineStatus = async (machineId) => {
  const now = new Date();

  // Find active bookings for this machine that are currently in progress
  const activeBookingsNow = await Booking.find({
    machineID: machineId,
    status: { $nin: ["Afsluttet", "Aflyst"] },
    startTime: { $lte: now },
    endTime: { $gt: now },
  });

  // Update machine status based on whether there are active bookings right now
  const newStatus = activeBookingsNow.length > 0 ? "Optaget" : "Ledig";
  await Machine.findByIdAndUpdate(
    machineId,
    { status: newStatus },
    { new: true }
  );

  return newStatus;
};

// Get all bookings with related data
export const getBookings = async (req, res) => {
  try {
    // Use .populate() with conditional path for projectID
    const bookings = await Booking.find({})
      .populate("machineID")
      .populate({
        path: "projectID",
        // Populate will ignore null/undefined values
      })
      .populate("employeeIDs");
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingID: req.params.id })
      .populate("machineID")
      .populate({
        path: "projectID",
        // Populate will ignore null/undefined values
      })
      .populate("employeeIDs");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking ikke fundet" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);

    // Update machine status based on whether the booking is active right now
    await updateMachineStatus(booking.machineID);

    // Get the new booking with related data
    const populatedBooking = await Booking.findById(booking._id)
      .populate("machineID")
      .populate({
        path: "projectID",
        // Populate will ignore null/undefined values
      })
      .populate("employeeIDs");
    res.status(201).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a booking
export const updateBooking = async (req, res) => {
  try {
    const oldBooking = await Booking.findOne({ bookingID: req.params.id });
    if (!oldBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking ikke fundet" });
    }

    const booking = await Booking.findOneAndUpdate(
      { bookingID: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate("machineID")
      .populate({
        path: "projectID",
        // Populate will ignore null/undefined values
      })
      .populate("employeeIDs");

    // If status is changed to "Completed" or "Cancelled"
    if (booking.status === "Afsluttet" || booking.status === "Aflyst") {
      await updateMachineStatus(booking.machineID);
    } else if (
      oldBooking.machineID.toString() !== booking.machineID._id.toString()
    ) {
      // If the machine is changed, update status for both the old and new machine
      await updateMachineStatus(oldBooking.machineID);
      await updateMachineStatus(booking.machineID);
    } else {
      // Otherwise update only the current machine's status
      await updateMachineStatus(booking.machineID);
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingID: req.params.id });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking ikke fundet" });
    }

    // Delete the booking
    await Booking.findOneAndDelete({ bookingID: req.params.id });

    // Update the machine status
    await updateMachineStatus(booking.machineID);

    res.status(200).json({ success: true, message: "Booking slettet" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
