import Project from "../models/project.model.js";
import Booking from "../models/booking.model.js";
import {
  checkProjectBookings,
  deleteProject,
} from "../controllers/project.controller.js";
import mongoose from "mongoose";

jest.mock("../models/project.model.js");
jest.mock("../models/booking.model.js");
jest.spyOn(mongoose.Types.ObjectId, "isValid").mockImplementation(() => true);

describe("Project Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkProjectBookings", () => {
    test("should return bookings for valid project ID", async () => {
      const mockBookings = [
        {
          bookingID: "B001",
          startTime: new Date(),
          endTime: new Date(),
        },
      ];

      Booking.find.mockResolvedValue(mockBookings);

      const req = { params: { id: "P001" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await checkProjectBookings(req, res);

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

    test("should handle invalid project ID", async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

      const req = { params: { id: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await checkProjectBookings(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid project ID",
      });
    });
  });

  describe("deleteProject", () => {
    test("should delete project and associated bookings", async () => {
      const mockBookings = [{ bookingID: "B001" }, { bookingID: "B002" }];

      Booking.find.mockResolvedValue(mockBookings);
      Booking.deleteMany.mockResolvedValue({ deletedCount: 2 });
      Project.findByIdAndDelete.mockResolvedValue({ _id: "P001" });

      const req = { params: { id: "P001" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteProject(req, res);

      expect(Booking.deleteMany).toHaveBeenCalledWith({ projectID: "P001" });
      expect(Project.findByIdAndDelete).toHaveBeenCalledWith("P001");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Project deleted successfully",
        deletedBookings: 2,
      });
    });

    test("should handle invalid project ID", async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

      const req = { params: { id: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid project ID",
      });
    });
  });
});
