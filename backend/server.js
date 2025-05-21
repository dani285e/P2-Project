import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import projectRoutes from "./routes/project.route.js";
import employeeRoutes from "./routes/employee.route.js";
import machineRoutes from "./routes/machine.route.js";
import bookingRoutes from "./routes/booking.route.js";
import cors from "cors";
import { updateAllMachineStatuses } from "./controllers/machine.controller.js";
import path from "path";
import { fileURLToPath } from "url";
import createError from "http-errors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json()); // allows us to accept JSON data in the request body
app.use(cors()); // Enable CORS for all routes

// API Routes
app.use("/api/projects", projectRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/bookings", bookingRoutes);

// Add source folder as static to be able to fetch JS modules
app.use(
  express.static(path.join(__dirname, "../frontend/src"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Specific pages - use Express for traditional serving
app.get("/employees", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/overview/employeeOverview.html")
  );
});

app.get("/machines", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/overview/machineOverview.html")
  );
});

app.get("/bookings", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/overview/bookingOverview.html")
  );
});

app.get("/create-project", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/create/createProject.html")
  );
});

app.get("/create-employee", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/create/createEmployee.html")
  );
});

app.get("/viewEmployee", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/view/viewEmployee.html")
  );
});

app.get("/editEmployee", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/edit/editEmployee.html")
  );
});

app.get("/viewProject", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/view/viewProject.html")
  );
});

app.get("/editProject", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/edit/editProject.html")
  );
});

app.get("/create-machine", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/create/createMachine.html")
  );
});

app.get("/viewMachine", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/view/viewMachine.html")
  );
});

app.get("/editMachine", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/edit/editMachine.html")
  );
});

// Serve projectOverview.html for the '/project' route
app.get("/project", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/overview/projectOverview.html")
  );
});

// Serve projectOverview.html for the root route, but keep the URL as '/'
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/overview/projectOverview.html")
  );
});

// 404 Handler (For all undefined routes)
app.use((req, res, next) => {
  next(createError(404, `Resource not found: ${req.originalUrl}`));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const statusText = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error",
    default: "Unknown Error",
  };

  const response = {
    status: statusCode,
    error: statusText[statusCode] || statusText.default,
    message:
      err.message || statusText[statusCode] || "An unexpected error occurred.",
  };

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  } else {
    console.error(`[${statusCode}] ${err.message}`);
  }

  res.status(statusCode).json(response);
});

// Start server and connect to database
app.listen(PORT, async () => {
  await connectDB();

  // Update machine status at server start
  await updateAllMachineStatuses();

  console.log(`Server is running on port http://localhost:${PORT}`);

  // Update machine status every minute (60000 ms)
  setInterval(updateAllMachineStatuses, 60000);
});
