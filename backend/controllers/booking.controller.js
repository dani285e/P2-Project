import Booking from "../models/booking.model.js";
import Machine from "../models/machine.model.js";

// Hjælpefunktion til at opdatere maskinstatus baseret på aktuelle bookinger
const updateMachineStatus = async (machineId) => {
  const now = new Date();

  // Find aktive bookinger for denne maskine som er i gang lige nu
  const activeBookingsNow = await Booking.find({
    machineID: machineId,
    status: { $nin: ["Afsluttet", "Aflyst"] },
    startTime: { $lte: now },
    endTime: { $gt: now },
  });

  // Opdater maskinstatus baseret på om der er aktive bookinger lige nu
  const newStatus = activeBookingsNow.length > 0 ? "Optaget" : "Ledig";
  await Machine.findByIdAndUpdate(
    machineId,
    { status: newStatus },
    { new: true }
  );

  return newStatus;
};

// Funktion til at opdatere status for alle maskiner
export const updateAllMachineStatuses = async (req, res) => {
  try {
    // Hent alle maskiner
    const machines = await Machine.find({});

    // Opdater status for hver maskine
    for (const machine of machines) {
      await updateMachineStatus(machine._id);
    }

    // Hvis dette er et API-kald, returner succesbesked
    if (res) {
      res.status(200).json({ message: "Alle maskiners status er opdateret" });
    }
  } catch (error) {
    console.error("Fejl ved opdatering af maskinstatusser:", error);
    // Hvis dette er et API-kald, returner fejlbesked
    if (res) {
      res.status(500).json({ message: error.message });
    }
  }
};

// Hent alle bookinger med relaterede data
export const getBookings = async (req, res) => {
  try {
    // Brug .populate() med betinget path for projectID
    const bookings = await Booking.find({})
      .populate("machineID")
      .populate({
        path: "projectID",
        // Populate vil ignorere null/undefined værdier
      })
      .populate("employeeIDs");
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hent en enkelt booking efter ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingID: req.params.id })
      .populate("machineID")
      .populate({
        path: "projectID",
        // Populate vil ignorere null/undefined værdier
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

// Opret en ny booking
export const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);

    // Opdater maskinens status baseret på om bookingen er aktiv lige nu
    await updateMachineStatus(booking.machineID);

    // Hent den nye booking med relaterede data
    const populatedBooking = await Booking.findById(booking._id)
      .populate("machineID")
      .populate({
        path: "projectID",
        // Populate vil ignorere null/undefined værdier
      })
      .populate("employeeIDs");
    res.status(201).json({ success: true, data: populatedBooking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Opdater en booking
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
        // Populate vil ignorere null/undefined værdier
      })
      .populate("employeeIDs");

    // Hvis status er ændret til "Afsluttet" eller "Aflyst"
    if (booking.status === "Afsluttet" || booking.status === "Aflyst") {
      await updateMachineStatus(booking.machineID);
    } else if (
      oldBooking.machineID.toString() !== booking.machineID._id.toString()
    ) {
      // Hvis maskinen er ændret, opdater status for både den gamle og den nye maskine
      await updateMachineStatus(oldBooking.machineID);
      await updateMachineStatus(booking.machineID);
    } else {
      // Ellers opdater kun den aktuelle maskines status
      await updateMachineStatus(booking.machineID);
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Slet en booking
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingID: req.params.id });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking ikke fundet" });
    }

    // Slet bookingen
    await Booking.findOneAndDelete({ bookingID: req.params.id });

    // Opdater maskinens status
    await updateMachineStatus(booking.machineID);

    res.status(200).json({ success: true, message: "Booking slettet" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
