import { createProject } from "../../js/projectOverview.js";

function toggleDateInput(checkboxId, dateContainerId) {
  const checkbox = document.getElementById(checkboxId);
  const dateContainer = document.getElementById(dateContainerId);

  if (checkbox.checked) {
    dateContainer.classList.remove("d-none");
  } else {
    dateContainer.classList.add("d-none");
  }
}

function setupInspectionCheckboxes() {
  const inspectionCheckboxes = document.querySelectorAll(".inspection-checkbox");

  inspectionCheckboxes.forEach((checkbox) => {
    const id = checkbox.id;
    const dateContainerId = `${id}DateContainer`;

    checkbox.addEventListener("change", () => {
      toggleDateInput(id, dateContainerId);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const projectForm = document.getElementById("project-form");

  const classProjectCheckbox = document.getElementById("isClassProject");
  const inspectionSection = document.getElementById("inspection-section");

  classProjectCheckbox.addEventListener("change", function () {
    if (this.checked) {
      inspectionSection.classList.remove("d-none");
    } else {
      inspectionSection.classList.add("d-none");
    }
  });

  setupInspectionCheckboxes();

  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(projectForm);

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

    if (project.isClassProject) {
      project.inspections = {
        firstInspection: {
          selected: formData.get("firstInspection") === "on",
          date: formData.get("firstInspectionDate") || null,
        },
        wpsWpqr: {
          selected: formData.get("wpsWpqr") === "on",
          date: formData.get("wpsWpqrDate") || null,
        },
        ndt: {
          selected: formData.get("ndt") === "on",
          date: formData.get("ndtDate") || null,
        },
        finalInspection: {
          selected: formData.get("finalInspection") === "on",
          date: formData.get("finalInspectionDate") || null,
        },
        report: {
          selected: formData.get("report") === "on",
          date: formData.get("reportDate") || null,
        },
      };
    }

    try {
      await createProject(project);
      alert("Projekt oprettet succesfuldt!");
      window.location.href = "/";
    } catch (error) {
      alert(`Fejl ved oprettelse af projekt: ${error.message}`);
    }
  });
});
