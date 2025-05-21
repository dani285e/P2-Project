// Import project service functions for fetching and updating project data
import { getProjectById, updateProject } from "../overview/projectOverview.js";

// Store the MongoDB ID of the current project
let currentProjectMongoId = null;

// Initialize the edit form when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Get project ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  // Redirect if no project ID is provided
  if (!projectId) {
    alert("Intet projekt-ID angivet!");
    window.location.href = "/";
    return;
  }

  try {
    // Fetch project data and initialize form
    const project = await getProjectById(projectId);
    currentProjectMongoId = project._id; // Store the MongoDB _id
    populateForm(project);
    setupEventListeners();
  } catch (error) {
    alert(`Fejl ved indlæsning af projekt: ${error.message}`);
    window.location.href = "/";
  }
});

// Function to populate form fields with project data
function populateForm(project) {
  // Set basic project information
  document.getElementById("project-id").value = project.projectID;
  document.getElementById("project-name").value = project.name;
  document.getElementById("customer").value = project.customer;
  document.getElementById("price").value = project.price;
  document.getElementById("description").value = project.description || "";

  // Format and set dates
  document.getElementById("start-date").value = formatDateForInput(
    project.startDate
  );
  document.getElementById("deadline").value = formatDateForInput(
    project.deadline
  );

  // Handle class project checkbox and inspection section
  const isClassProjectCheckbox = document.getElementById("is-class-project");
  isClassProjectCheckbox.checked = project.isClassProject;

  document
    .getElementById("inspections-container")
    .classList.toggle("d-none", !project.isClassProject);

  // Set inspection data if available
  if (project.inspections) {
    setInspection(
      "first-inspection",
      "first-inspection-date",
      project.inspections.firstInspection
    );
    setInspection("wps-wpqr", "wps-wpqr-date", project.inspections.wpsWpqr);
    setInspection("ndt", "ndt-date", project.inspections.ndt);
    setInspection(
      "final-inspection",
      "final-inspection-date",
      project.inspections.finalInspection
    );
    setInspection("report", "report-date", project.inspections.report);
  }
}

// Function to set up all event listeners
function setupEventListeners() {
  // Toggle inspection section visibility based on class project checkbox
  document
    .getElementById("is-class-project")
    .addEventListener("change", function () {
      document
        .getElementById("inspections-container")
        .classList.toggle("d-none", !this.checked);
    });

  // Handle inspection checkbox changes
  document.querySelectorAll(".inspection-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const dateInputId = this.id + "-date";
      const dateInput = document.getElementById(dateInputId);
      dateInput.disabled = !this.checked;
    });
  });

  // Handle cancel button
  document.getElementById("btn-cancel").addEventListener("click", () => {
    window.history.back();
  });

  // Handle form submission
  document
    .getElementById("edit-project-form")
    .addEventListener("submit", handleFormSubmit);
}

// Function to handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  // Use the stored MongoDB _id for update
  const mongoId = currentProjectMongoId;

  // Collect form data
  const projectData = {
    projectID: document.getElementById("project-id").value,
    name: form.name.value,
    customer: form.customer.value,
    description: form.description.value,
    startDate: form.startDate.value,
    deadline: form.deadline.value,
    price: parseFloat(form.price.value),
    isClassProject: form.isClassProject.checked,
  };

  // Add inspection data if it's a class project
  if (projectData.isClassProject) {
    projectData.inspections = {
      firstInspection: getInspectionData(
        "first-inspection",
        "first-inspection-date"
      ),
      wpsWpqr: getInspectionData("wps-wpqr", "wps-wpqr-date"),
      ndt: getInspectionData("ndt", "ndt-date"),
      finalInspection: getInspectionData(
        "final-inspection",
        "final-inspection-date"
      ),
      report: getInspectionData("report", "report-date"),
    };
  }

  try {
    // Submit updated project data to the server
    await updateProject(mongoId, projectData);
    alert("Projektet er opdateret!");
    window.location.href = `/viewProject?id=${mongoId}`;
  } catch (error) {
    alert(`Fejl ved opdatering af projekt: ${error.message}`);
  }
}

// Helper function to format date for input fields
function formatDateForInput(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

// Function to set inspection checkbox and date input values
function setInspection(checkboxId, dateInputId, inspectionData) {
  if (!inspectionData) return;

  const checkbox = document.getElementById(checkboxId);
  const dateInput = document.getElementById(dateInputId);

  checkbox.checked = inspectionData.selected;
  dateInput.disabled = !inspectionData.selected;

  if (inspectionData.selected && inspectionData.date) {
    dateInput.value = formatDateForInput(inspectionData.date);
  }
}

// Function to get inspection data from form
function getInspectionData(checkboxId, dateInputId) {
  const checkbox = document.getElementById(checkboxId);
  const dateInput = document.getElementById(dateInputId);

  return {
    selected: checkbox.checked,
    date: checkbox.checked ? dateInput.value : null,
  };
}
