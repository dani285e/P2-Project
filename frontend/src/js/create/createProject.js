import { createProject } from "../overview/projectOverview.js";

// Toggle visibility of date input fields based on checkbox state
function toggleDateInput(checkboxId, dateContainerId) {
  const checkbox = document.getElementById(checkboxId);
  const dateContainer = document.getElementById(dateContainerId);

  if (checkbox.checked) {
    dateContainer.classList.remove("d-none");
  } else {
    dateContainer.classList.add("d-none");
  }
}

// Set up event listeners for all inspection checkboxes
function setupInspectionCheckboxes() {
  const inspectionCheckboxes = document.querySelectorAll(
    ".inspection-checkbox"
  );

  inspectionCheckboxes.forEach((checkbox) => {
    const id = checkbox.id;
    const dateContainerId = `${id}DateContainer`;

    checkbox.addEventListener("change", () => {
      toggleDateInput(id, dateContainerId);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const projectForm = document.getElementById("project-form");
  const classProjectCheckbox = document.getElementById("isClassProject");
  const inspectionSection = document.getElementById("inspection-section");

  // Toggle inspection section visibility based on class project checkbox
  classProjectCheckbox.addEventListener("change", function () {
    if (this.checked) {
      inspectionSection.classList.remove("d-none");
    } else {
      inspectionSection.classList.add("d-none");
    }
  });

  // Initialize inspection checkboxes
  setupInspectionCheckboxes();

  // Handle form submission
  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(projectForm);

    // Create project object with basic information
    const project = {
      projectID: formData.get("projectID"),
      name: formData.get("name"),
      customer: formData.get("customer"),
      description: formData.get("description"),
      startDate: formData.get("startDate"),
      deadline: formData.get("deadline"),
      price: Number(formData.get("price")),
      isClassProject: formData.get("isClassProject") === "on",
    };

    // Add inspection data if it's a class project
    if (project.isClassProject) {
      project.inspections = {
        firstInspection: {
          selected: formData.get("firstInspection") === "on",
          date: formData.get("firstInspectionDate") || null,
          completed: false,
        },
        wpsWpqr: {
          selected: formData.get("wpsWpqr") === "on",
          date: formData.get("wpsWpqrDate") || null,
          completed: false,
        },
        ndt: {
          selected: formData.get("ndt") === "on",
          date: formData.get("ndtDate") || null,
          completed: false,
        },
        finalInspection: {
          selected: formData.get("finalInspection") === "on",
          date: formData.get("finalInspectionDate") || null,
          completed: false,
        },
        report: {
          selected: formData.get("report") === "on",
          date: formData.get("reportDate") || null,
          completed: false,
        },
      };
    }

    try {
      // Submit project data to the server
      await createProject(project);
      alert("Projekt oprettet succesfuldt!");
      window.location.href = "/";
    } catch (error) {
      alert(`Fejl ved oprettelse af projekt: ${error.message}`);
    }
  });
});
