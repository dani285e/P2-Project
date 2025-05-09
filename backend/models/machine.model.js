import mongoose from "mongoose";

// Schema for maskiner
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
    status: { type: String, default: "Ledig" },
  },
  { timestamps: true } // createdAt og updatedAt tilføjes automatisk
);

// Pre-save middleware til at sikre, at machineID er unikt
machineSchema.pre("save", async function (next) {
  if (this.isNew) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Forsøg at generere et unikt machineID
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
        new Error("Kunne ikke generere unikt machineID efter flere forsøg")
      );
    }
  }

  next();
});

const Machine = mongoose.model("Machine", machineSchema);

export default Machine;
