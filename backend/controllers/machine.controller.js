import Machine from "../models/machine.model.js";
import Booking from "../models/booking.model.js";

// Get all machines
export const getMachines = async (req, res) => {
  try {
    const machines = await Machine.find({}).sort({ order: 1 });
    res.status(200).json({ success: true, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single machine by ID
export const getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res
        .status(404)
        .json({ success: false, message: "Maskine ikke fundet" });
    }
    res.status(200).json({ success: true, data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new machine
export const createMachine = async (req, res) => {
  try {
    const machine = await Machine.create(req.body);
    res.status(201).json({ success: true, data: machine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a machine
export const updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!machine) {
      return res
        .status(404)
        .json({ success: false, message: "Maskine ikke fundet" });
    }
    res.status(200).json({ success: true, data: machine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Check number of bookings before deletion
export const checkMachineBookings = async (req, res) => {
  try {
    const bookingsUsingMachine = await Booking.find({
      machineID: req.params.id,
    });
    res.status(200).json({
      success: true,
      count: bookingsUsingMachine.length,
      bookings: bookingsUsingMachine.map((b) => ({
        bookingID: b.bookingID,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a machine
export const deleteMachine = async (req, res) => {
  try {
    // First check if the machine exists
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res
        .status(404)
        .json({ success: false, message: "Maskine ikke fundet" });
    }

    // Find bookings that use this machine
    const bookingsUsingMachine = await Booking.find({
      machineID: req.params.id,
    });

    if (bookingsUsingMachine.length > 0) {
      // Delete all bookings that use this machine
      await Booking.deleteMany({ machineID: req.params.id });
    }

    // Delete the machine
    await Machine.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Maskine slettet",
      deletedBookings: bookingsUsingMachine.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function to update all machine statuses based on active bookings
export const updateAllMachineStatuses = async () => {
  try {
    const now = new Date();

    // Get all machines
    const machines = await Machine.find({});

    // Get active bookings running right now (starting before now and ending after now)
    const activeBookingsNow = await Booking.find({
      status: { $nin: ["Afsluttet", "Aflyst"] },
      startTime: { $lte: now },
      endTime: { $gt: now },
    });

    // Create a set of machine IDs that are in use right now
    const busyMachineIds = new Set(
      activeBookingsNow.map((booking) => booking.machineID.toString())
    );

    // Update status for each machine
    for (const machine of machines) {
      const isBusy = busyMachineIds.has(machine._id.toString());
      const newStatus = isBusy ? "Optaget" : "Ledig";

      // Only update if status actually changes
      if (machine.status !== newStatus) {
        await Machine.findByIdAndUpdate(machine._id, { status: newStatus });
        console.log(`Machine ${machine.name} status changed to ${newStatus}`);
      }
    }

    console.log("All machine statuses have been updated");
  } catch (error) {
    console.error("Error updating machine statuses:", error);
  }
};

// Update machine order
export const updateMachineOrder = async (req, res) => {
  try {
    const { machineOrders } = req.body;

    if (!Array.isArray(machineOrders)) {
      return res.status(400).json({
        success: false,
        message: "machineOrders must be an array",
      });
    }

    // Validate each machineOrder
    for (const order of machineOrders) {
      if (!order.machineId || typeof order.order !== "number") {
        return res.status(400).json({
          success: false,
          message: "Each machineOrder must have machineId and order",
        });
      }
    }

    // Update each machine in a transaction
    for (const { machineId, order } of machineOrders) {
      const machine = await Machine.findById(machineId);
      if (!machine) {
        return res.status(404).json({
          success: false,
          message: `Machine with ID ${machineId} not found`,
        });
      }
      await Machine.findByIdAndUpdate(machineId, { order });
    }

    res.status(200).json({
      success: true,
      message: "Order updated",
    });
  } catch (error) {
    console.error("Error updating machine order:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error updating order",
    });
  }
};
