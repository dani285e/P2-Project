import Booking from "../models/booking.model.js";
import Machine from "../models/machine.model.js";
import {
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/booking.controller.js";
import mongoose from "mongoose";

jest.mock("../models/booking.model.js");
jest.mock("../models/machine.model.js");

// Mock ObjectId.isValid to always return true (if needed in future tests)
jest.spyOn(mongoose.Types.ObjectId, "isValid").mockImplementation(() => true);

describe("Booking Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBooking", () => {
    test("should create a new booking and update machine status", async () => {
      const mockBooking = {
        _id: "B001",
        machineID: "M001",
        startTime: new Date(),
        endTime: new Date(),
        projectID: "P001",
        status: "Aktiv",
        bookingID: "B001",
        employeeIDs: [],
      };

      Booking.create.mockResolvedValue(mockBooking);
      Booking.findById.mockReturnValue({
        populate: function () {
          return this;
        },
        ...mockBooking,
      });
      Booking.find.mockResolvedValue([]);
      Machine.findByIdAndUpdate.mockResolvedValue({ status: "Optaget" });

      const req = {
        body: {
          machineID: "M001",
          startTime: mockBooking.startTime,
          endTime: mockBooking.endTime,
          projectID: "P001",
          status: "Aktiv",
          bookingID: "B001",
          employeeIDs: [],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await createBooking(req, res);

      if (res.status.mock.calls[0][0] !== 201) {
        console.log("createBooking error:", res.json.mock.calls[0][0]);
      }
      expect(Booking.create).toHaveBeenCalledWith(req.body);
      expect(Machine.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe("updateBooking", () => {
    test("should update booking and handle machine status changes", async () => {
      const oldBooking = {
        _id: "B001",
        machineID: "M001",
        status: "Aktiv",
        bookingID: "B001",
        employeeIDs: [],
      };

      const updatedBooking = {
        _id: "B001",
        machineID: { _id: "M001" },
        status: "Afsluttet",
        bookingID: "B001",
        employeeIDs: [],
      };

      Booking.findOne.mockResolvedValue(oldBooking);
      Booking.findOneAndUpdate.mockReturnValue({
        populate: function () {
          return this;
        },
        ...updatedBooking,
      });
      Booking.find.mockResolvedValue([]);
      Machine.findByIdAndUpdate.mockResolvedValue({ status: "Ledig" });

      const req = {
        params: { id: "B001" },
        body: {
          status: "Afsluttet",
          machineID: "M001",
          bookingID: "B001",
          employeeIDs: [],
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateBooking(req, res);

      if (!Machine.findByIdAndUpdate.mock.calls.length) {
        console.log("updateBooking error:", res.json.mock.calls[0][0]);
      }
      expect(Booking.findOneAndUpdate).toHaveBeenCalled();
      expect(Machine.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe("deleteBooking", () => {
    test("should delete booking and update machine status", async () => {
      const mockBooking = {
        _id: "B001",
        machineID: "M001",
        bookingID: "B001",
        employeeIDs: [],
      };

      Booking.findOne.mockResolvedValue(mockBooking);
      Booking.findOneAndDelete.mockResolvedValue(mockBooking);
      Booking.find.mockResolvedValue([]);
      Machine.findByIdAndUpdate.mockResolvedValue({ status: "Ledig" });

      const req = { params: { id: "B001" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteBooking(req, res);

      expect(Booking.findOneAndDelete).toHaveBeenCalled();
      expect(Machine.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Booking slettet",
      });
    });
  });
});
