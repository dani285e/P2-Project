import Machine from "../models/machine.model.js";
import Booking from "../models/booking.model.js";

// Hent alle maskiner
export const getMachines = async (req, res) => {
  try {
    const machines = await Machine.find({});
    res.status(200).json({ success: true, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hent en enkelt maskine efter ID
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

// Opret en ny maskine
export const createMachine = async (req, res) => {
  try {
    const machine = await Machine.create(req.body);
    res.status(201).json({ success: true, data: machine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Opdater en maskine
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

// Slet en maskine
export const deleteMachine = async (req, res) => {
  try {
    // Tjek først om maskinen eksisterer
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res
        .status(404)
        .json({ success: false, message: "Maskine ikke fundet" });
    }

    // Tjek om der er bookinger, der bruger denne maskine
    const bookingsUsingMachine = await Booking.find({
      machineID: req.params.id,
    });

    if (bookingsUsingMachine.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Kan ikke slette maskinen, da den bruges i eksisterende bookinger",
        count: bookingsUsingMachine.length,
        bookings: bookingsUsingMachine.map((b) => b.bookingID),
      });
    }

    // Hvis ingen bookinger bruger maskinen, kan vi slette den
    await Machine.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Maskine slettet" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hjælpefunktion til at opdatere alle maskiners status baseret på aktive bookinger
export const updateAllMachineStatuses = async () => {
  try {
    const now = new Date();

    // Hent alle maskiner
    const machines = await Machine.find({});

    // Hent aktive bookinger som kører lige nu (starter før nu og slutter efter nu)
    const activeBookingsNow = await Booking.find({
      status: { $nin: ["Afsluttet", "Aflyst"] },
      startTime: { $lte: now },
      endTime: { $gt: now },
    });

    // Opret et set af maskine-ID'er der er i brug lige nu
    const busyMachineIds = new Set(
      activeBookingsNow.map((booking) => booking.machineID.toString())
    );

    // Opdater status for hver maskine
    for (const machine of machines) {
      const isBusy = busyMachineIds.has(machine._id.toString());
      const newStatus = isBusy ? "Optaget" : "Ledig";

      // Kun opdater hvis status faktisk ændres
      if (machine.status !== newStatus) {
        await Machine.findByIdAndUpdate(machine._id, { status: newStatus });
        console.log(`Maskine ${machine.name} status ændret til ${newStatus}`);
      }
    }

    console.log("Alle maskiners status er blevet opdateret");
  } catch (error) {
    console.error("Fejl ved opdatering af maskiners status:", error);
  }
};
