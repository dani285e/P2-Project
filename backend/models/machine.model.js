import mongoose from "mongoose";

// Schema for machines
const machineSchema = new mongoose.Schema(
  {
    machineID: {
      type: String,
      unique: true,
      default: function () {
        return (
          "M" +
          Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")
        );
      },
    },
    name: { type: String, required: true },
    status: { type: String, required: true, default: "Ledig" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true } // createdAt and updatedAt are added automatically
);

// Pre-save middleware to ensure machineID is unique
machineSchema.pre("save", async function (next) {
  if (this.isNew) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to generate a unique machineID
    while (!isUnique && attempts < maxAttempts) {
      const machineID =
        "M" +
        Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
      const existingMachine = await mongoose
        .model("Machine")
        .findOne({ machineID });

      if (!existingMachine) {
        this.machineID = machineID;
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      return next(
        new Error("Could not generate unique machineID after several attempts")
      );
    }
  }

  next();
});

const Machine = mongoose.model("Machine", machineSchema);

export default Machine;
