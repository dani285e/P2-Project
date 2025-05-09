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

// Statiske filer
const staticPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(staticPath));

// Tilføj source-mappen som statisk for at kunne hente JS-moduler
app.use(
  express.static(path.join(__dirname, "../frontend/src"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Specifikke sider - brug Express til traditionel servering
app.get("/employees", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/employeeOverview.html")
  );
});

app.get("/machines", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/machineOverview.html")
  );
});

app.get("/bookings", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/bookingOverview.html")
  );
});

app.get("/create-project", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/createProject.html")
  );
});

app.get("/create-employee", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/createEmployee.html")
  );
});

app.get("/viewEmployee", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/src/pages/viewEmployee.html"));
});

app.get("/editEmployee", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/src/pages/editEmployee.html"));
});

app.get("/viewProject", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/src/pages/viewProject.html"));
});

app.get("/editProject", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/src/pages/editProject.html"));
});

app.get("/create-machine", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/src/pages/createMachine.html")
  );
});

app.get("/viewMachine", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/src/pages/viewMachine.html"));
});

app.get("/editMachine", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/src/pages/editMachine.html"));
});

// Standardrute for alt andet - sender til forsiden
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, async () => {
  await connectDB();

  // Opdater maskinstatus ved serverstart
  await updateAllMachineStatuses();

  console.log(`Server is running on port http://localhost:${PORT}`);

  // Opdater maskinstatus hvert 5. minut (300000 ms)
  setInterval(updateAllMachineStatuses, 300000);
});
