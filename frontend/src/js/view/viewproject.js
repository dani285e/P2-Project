import { getProjectById, deleteProject } from "../overview/projectOverview.js";
document.addEventListener("DOMContentLoaded", async () => {
  // Get project ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  if (!projectId) {
    alert("Intet projekt-ID angivet!");
    window.location.href = "/";
    return;
  }

  try {
    // Fetch project details
    const project = await getProjectById(projectId);
    renderProjectDetails(project);

    // Set up button event listeners
    document.getElementById("btn-edit").addEventListener("click", () => {
      window.location.href = `/editProject?id=${projectId}`;
    });

    document
      .getElementById("btn-delete")
      .addEventListener("click", async () => {
        try {
          await deleteProject(projectId);
          window.location.href = "/";
        } catch (error) {
          alert(`Fejl ved sletning af projekt: ${error.message}`);
        }
      });
  } catch (error) {
    alert(`Fejl ved indlæsning af projekt: ${error.message}`);
    window.location.href = "/";
  }
});

function renderProjectDetails(project) {
  const projectDetailsElement = document.getElementById("project-details");

  // Format dates
  const startDate = new Date(project.startDate).toLocaleDateString("da-DK");
  const deadline = new Date(project.deadline).toLocaleDateString("da-DK");

  let inspectionsHtml = "";

  if (project.isClassProject && project.inspections) {
    inspectionsHtml = `
      <dt>Inspektioner</dt>
      <dd>
        <ul class="list-group">
          ${renderInspection(
            "1. Inspektion",
            project.inspections.firstInspection,
            "firstInspection",
            project._id
          )}
          ${renderInspection(
            "WPS/WPQR",
            project.inspections.wpsWpqr,
            "wpsWpqr",
            project._id
          )}
          ${renderInspection(
            "NDT",
            project.inspections.ndt,
            "ndt",
            project._id
          )}
          ${renderInspection(
            "Final Inspection",
            project.inspections.finalInspection,
            "finalInspection",
            project._id
          )}
          ${renderInspection(
            "Report",
            project.inspections.report,
            "report",
            project._id
          )}
        </ul>
      </dd>
    `;
  }

  projectDetailsElement.innerHTML = `
    <h2 class="text-primary">${project.name}</h2>
    <dl class="row">
      <dt class="col-sm-4">Projekt ID</dt>
      <dd class="col-sm-8">${project.projectID}</dd>
      <dt class="col-sm-4">Kunde</dt>
      <dd class="col-sm-8">${project.customer}</dd>
      <dt class="col-sm-4">Beskrivelse</dt>
      <dd class="col-sm-8">${project.description || "Ingen beskrivelse"}</dd>
      <dt class="col-sm-4">Startdato</dt>
      <dd class="col-sm-8">${startDate}</dd>
      <dt class="col-sm-4">Deadline</dt>
      <dd class="col-sm-8">${deadline}</dd>
      <dt class="col-sm-4">Pris</dt>
      <dd class="col-sm-8">${project.price.toLocaleString("da-DK")} kr.</dd>
      <dt class="col-sm-4">Klasseprojekt</dt>
      <dd class="col-sm-8">${project.isClassProject ? "Ja" : "Nej"}</dd>
      ${inspectionsHtml}
    </dl>
  `;
}

// Global function to toggle inspection completion status
window.toggleInspectionCompleted = async function (
  projectId,
  inspectionKey,
  completed
) {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/inspection/${inspectionKey}/completed`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed }),
      }
    );

    const data = await response.json();
    if (data.success) {
      // Reload the page to show updated status
      window.location.reload();
    } else {
      alert(`Fejl ved opdatering af inspektion: ${data.message}`);
    }
  } catch (error) {
    alert(`Fejl ved opdatering af inspektion: ${error.message}`);
  }
};

function renderInspection(name, inspection, inspectionKey, projectId) {
  if (!inspection || !inspection.selected) {
    return "";
  }
  const inspectionDate = inspection.date
    ? new Date(inspection.date).toLocaleDateString("da-DK")
    : "Ingen dato angivet";

  const isCompleted = inspection.completed || false;
  const completedClass = isCompleted ? "list-group-item-success" : "";
  const completedText = isCompleted ? " ✓ Færdig" : "";

  return `
    <li class="list-group-item d-flex justify-content-between align-items-center ${completedClass}">
      <div>
        <strong>${name}:</strong> ${inspectionDate}${completedText}
      </div>
      <button 
        class="btn btn-sm ${isCompleted ? "btn-warning" : "btn-success"}" 
        onclick="toggleInspectionCompleted('${projectId}', '${inspectionKey}', ${!isCompleted})"
      >
        ${isCompleted ? "Marker som ikke færdig" : "Marker som færdig"}
      </button>
    </li>
  `;
}
