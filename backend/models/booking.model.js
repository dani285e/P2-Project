import mongoose from "mongoose";

// Schema for bookinger
const bookingSchema = new mongoose.Schema(
  {
    bookingID: { type: String, required: true, unique: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    machineID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    projectID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: function () {
        return !this.maintenanceType; // Kun påkrævet hvis ikke vedligeholdelse
      },
    },
    maintenanceType: {
      type: String,
      enum: ["general", null],
      default: null,
    },
    employeeIDs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["Planlagt", "I gang", "Afsluttet", "Aflyst"],
      default: "Planlagt",
    },
    notes: { type: String },
  },
  { timestamps: true } // createdAt og updatedAt tilføjes automatisk
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
