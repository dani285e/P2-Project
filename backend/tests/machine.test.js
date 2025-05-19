import Machine from "../models/machine.model.js";
import Booking from "../models/booking.model.js";
import {
  checkMachineBookings,
  deleteMachine,
} from "../controllers/machine.controller.js";
import mongoose from "mongoose";

jest.mock("../models/machine.model.js");
jest.mock("../models/booking.model.js");
jest.spyOn(mongoose.Types.ObjectId, "isValid").mockImplementation(() => true);

describe("Machine Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkMachineBookings", () => {
    test("should return bookings for valid machine ID", async () => {
      const mockBookings = [
        {
          bookingID: "B001",
          startTime: new Date(),
          endTime: new Date(),
        },
      ];

      Booking.find.mockResolvedValue(mockBookings);

      const req = { params: { id: "M001" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await checkMachineBookings(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        bookings: [
          {
            bookingID: "B001",
            startTime: mockBookings[0].startTime,
            endTime: mockBookings[0].endTime,
          },
        ],
      });
    });

    test("should handle invalid machine ID", async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);
      Machine.findById.mockResolvedValue(null);
      Booking.find.mockResolvedValue([]);

      const req = { params: { id: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await checkMachineBookings(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        bookings: [],
      });
    });
  });

  describe("deleteMachine", () => {
    test("should delete machine and associated bookings", async () => {
      const mockBookings = [{ bookingID: "B001" }, { bookingID: "B002" }];

      Machine.findById.mockResolvedValue({ _id: "M001" });
      Booking.find.mockResolvedValue(mockBookings);
      Booking.deleteMany.mockResolvedValue({ deletedCount: 2 });
      Machine.findByIdAndDelete.mockResolvedValue({ _id: "M001" });

      const req = { params: { id: "M001" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteMachine(req, res);

      expect(Booking.deleteMany).toHaveBeenCalledWith({ machineID: "M001" });
      expect(Machine.findByIdAndDelete).toHaveBeenCalledWith("M001");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Maskine slettet",
        deletedBookings: 2,
      });
    });

    test("should handle invalid machine ID", async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);
      Machine.findById.mockResolvedValue(null);

      const req = { params: { id: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteMachine(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Maskine ikke fundet",
      });
    });
  });
});
