// Moved all inline script logic from editProject.html
import { getProjectById, updateProject } from "../projectOverview.js";

let currentProjectMongoId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  if (!projectId) {
    alert("Intet projekt-ID angivet!");
    window.location.href = "/";
    return;
  }

  try {
    const project = await getProjectById(projectId);
    currentProjectMongoId = project._id; // Store the MongoDB _id
    populateForm(project);
    setupEventListeners();
  } catch (error) {
    alert(`Fejl ved indlæsning af projekt: ${error.message}`);
    window.location.href = "/";
  }
});

function populateForm(project) {
  document.getElementById("project-id").value = project.projectID;
  document.getElementById("project-name").value = project.name;
  document.getElementById("customer").value = project.customer;
  document.getElementById("price").value = project.price;
  document.getElementById("description").value = project.description || "";

  document.getElementById("start-date").value = formatDateForInput(project.startDate);
  document.getElementById("deadline").value = formatDateForInput(project.deadline);

  const isClassProjectCheckbox = document.getElementById("is-class-project");
  isClassProjectCheckbox.checked = project.isClassProject;

  document.getElementById("inspections-container").classList.toggle("d-none", !project.isClassProject);

  if (project.inspections) {
    setInspection("first-inspection", "first-inspection-date", project.inspections.firstInspection);
    setInspection("wps-wpqr", "wps-wpqr-date", project.inspections.wpsWpqr);
    setInspection("ndt", "ndt-date", project.inspections.ndt);
    setInspection("final-inspection", "final-inspection-date", project.inspections.finalInspection);
    setInspection("report", "report-date", project.inspections.report);
  }
}

function setupEventListeners() {
  document.getElementById("is-class-project").addEventListener("change", function () {
    document.getElementById("inspections-container").classList.toggle("d-none", !this.checked);
  });

  document.querySelectorAll(".inspection-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const dateInputId = this.id + "-date";
      const dateInput = document.getElementById(dateInputId);
      dateInput.disabled = !this.checked;
    });
  });

  document.getElementById("btn-cancel").addEventListener("click", () => {
    window.history.back();
  });

  document.getElementById("edit-project-form").addEventListener("submit", handleFormSubmit);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  // Use the stored MongoDB _id for update
  const mongoId = currentProjectMongoId;

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

  if (projectData.isClassProject) {
    projectData.inspections = {
      firstInspection: getInspectionData("first-inspection", "first-inspection-date"),
      wpsWpqr: getInspectionData("wps-wpqr", "wps-wpqr-date"),
      ndt: getInspectionData("ndt", "ndt-date"),
      finalInspection: getInspectionData("final-inspection", "final-inspection-date"),
      report: getInspectionData("report", "report-date"),
    };
  }

  try {
    await updateProject(mongoId, projectData); // Use _id for update
    alert("Projektet er opdateret!");
    window.location.href = `/viewProject?id=${mongoId}`;
  } catch (error) {
    alert(`Fejl ved opdatering af projekt: ${error.message}`);
  }
}

function formatDateForInput(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

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

function getInspectionData(checkboxId, dateInputId) {
  const checkbox = document.getElementById(checkboxId);
  const dateInput = document.getElementById(dateInputId);

  return {
    selected: checkbox.checked,
    date: checkbox.checked ? dateInput.value : null,
  };
}
