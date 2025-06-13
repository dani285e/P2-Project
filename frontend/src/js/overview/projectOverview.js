// Global variables for project list management
let allProjectsV2 = [];
let sortFieldV2 = "projectID";
let sortDirectionV2 = "asc";
let searchQueryV2 = "";

// Update sort button icon based on current sort direction
function updateSortButtonTextV2() {
  const sortIcon = document.getElementById("sort-icon");
  if (sortDirectionV2 === "asc") {
    sortIcon.className = "bi bi-sort-alpha-down";
  } else {
    sortIcon.className = "bi bi-sort-alpha-up";
  }
}

// Filter and sort projects based on search query and sort settings
function filterAndSortProjectsV2() {
  let filteredProjects = [...allProjectsV2];
  if (searchQueryV2) {
    const query = searchQueryV2.toLowerCase();
    filteredProjects = filteredProjects.filter(
      (project) =>
        (project.projectID &&
          project.projectID.toString().toLowerCase().includes(query)) ||
        (project.name && project.name.toLowerCase().includes(query)) ||
        (project.customer && project.customer.toLowerCase().includes(query))
    );
  }
  filteredProjects.sort((a, b) => {
    const valA = (a[sortFieldV2] || "").toString();
    const valB = (b[sortFieldV2] || "").toString();
    const comparison = valA.localeCompare(valB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return sortDirectionV2 === "asc" ? comparison : -comparison;
  });
  window.renderProjectsV2(filteredProjects);
}

// Initialize page functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const sortFieldSelect = document.getElementById("sort-field");
  const sortDirectionButton = document.getElementById("sort-direction");

  // Set up search functionality if elements exist
  if (searchInput && searchButton) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQueryV2 = searchInput.value.trim();
        filterAndSortProjectsV2();
      }
    });
    searchButton.addEventListener("click", () => {
      searchQueryV2 = searchInput.value.trim();
      filterAndSortProjectsV2();
    });
  }

  // Set up sorting functionality if elements exist
  if (sortFieldSelect && sortDirectionButton) {
    sortFieldSelect.addEventListener("change", () => {
      sortFieldV2 = sortFieldSelect.value;
      sortDirectionV2 = "asc";
      updateSortButtonTextV2();
      filterAndSortProjectsV2();
    });
    sortDirectionButton.addEventListener("click", () => {
      sortDirectionV2 = sortDirectionV2 === "asc" ? "desc" : "asc";
      updateSortButtonTextV2();
      filterAndSortProjectsV2();
    });
  }
});

// Helper function to calculate inspection progress for class projects
function getClassProjectDisplay(project) {
  if (!project.inspections) {
    return "Ja (0/0)";
  }

  const inspectionTypes = [
    "firstInspection",
    "wpsWpqr",
    "ndt",
    "finalInspection",
    "report",
  ];
  let totalSelected = 0;
  let totalCompleted = 0;
  let hasOverdueInspection = false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset tid til midnat for korrekt sammenligning

  inspectionTypes.forEach((type) => {
    if (project.inspections[type] && project.inspections[type].selected) {
      totalSelected++;
      if (project.inspections[type].completed) {
        totalCompleted++;
      }

      // Tjek om inspektionen er overskredet og ikke færdig
      if (
        project.inspections[type].date &&
        !project.inspections[type].completed
      ) {
        const inspectionDate = new Date(project.inspections[type].date);
        inspectionDate.setHours(0, 0, 0, 0);
        if (inspectionDate < today) {
          hasOverdueInspection = true;
        }
      }
    }
  });

  const countText = `(${totalCompleted}/${totalSelected})`;

  if (hasOverdueInspection) {
    return `Ja <span class="text-danger fw-bold" title="En eller flere inspektioner er overskredet">${countText}</span>`;
  }

  return `Ja ${countText}`;
}

// Render projects in the table with responsive design
export function renderProjectsV2(projects) {
  const tbody = document.getElementById("project-list-body-v2");
  if (!tbody) return;
  if (!projects || projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan='8' class='text-muted text-center'>Ingen projekter fundet.</td></tr>`;
    return;
  }
  let html = "";
  projects.forEach((project) => {
    const startDate = project.startDate
      ? new Date(project.startDate).toLocaleDateString("da-DK")
      : "-";
    const deadline = project.deadline
      ? new Date(project.deadline).toLocaleDateString("da-DK")
      : "-";
    html += `
      <tr>
        <td>${project.projectID || "-"}</td>
        <td>${project.name || "-"}</td>
        <td class="d-none d-md-table-cell">${project.customer || "-"}</td>
        <td class="d-none d-lg-table-cell">${startDate}</td>
        <td class="d-none d-lg-table-cell">${deadline}</td>
        <td class="d-none d-xl-table-cell">${
          project.price != null
            ? project.price.toLocaleString("da-DK") + " kr."
            : "-"
        }</td>
        <td class="d-none d-xl-table-cell">${
          project.isClassProject ? getClassProjectDisplay(project) : "Nej"
        }</td>
        <td>
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-info btn-sm btn-view-v2 me-1" data-id="${
              project._id
            }"><i class="bi bi-eye"></i> Vis</button>
            <button type="button" class="btn btn-warning btn-sm btn-edit-v2 me-1" data-id="${
              project._id
            }"><i class="bi bi-pencil"></i> Rediger</button>
            <button type="button" class="btn btn-danger btn-sm btn-delete-v2" data-id="${
              project._id
            }" data-name="${
      project.name
    }"><i class="bi bi-trash"></i> Slet</button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  // Add event listeners for action buttons
  tbody.querySelectorAll(".btn-view-v2").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof window.viewProject === "function") {
        window.viewProject(btn.dataset.id);
      } else {
        console.warn("window.viewProject is not a function", btn.dataset.id);
      }
    });
  });
  tbody.querySelectorAll(".btn-edit-v2").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof window.editProject === "function") {
        window.editProject(btn.dataset.id);
      } else {
        console.warn("window.editProject is not a function", btn.dataset.id);
      }
    });
  });
  tbody.querySelectorAll(".btn-delete-v2").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof window.handleDeleteProject === "function") {
        window.handleDeleteProject(btn.dataset.id, btn.dataset.name);
      } else {
        console.warn(
          "window.handleDeleteProject is not a function",
          btn.dataset.id,
          btn.dataset.name
        );
      }
    });
  });
}
window.renderProjectsV2 = renderProjectsV2;

// Define global navigation functions if not already defined
if (typeof window.viewProject !== "function") {
  window.viewProject = function (id) {
    window.location.href = `/viewProject?id=${id}`;
  };
}
if (typeof window.editProject !== "function") {
  window.editProject = function (id) {
    window.location.href = `/editProject?id=${id}`;
  };
}
if (typeof window.handleDeleteProject !== "function") {
  window.handleDeleteProject = async function (id, name) {
    try {
      // Check for existing bookings before deletion
      const checkResponse = await fetch(`/api/projects/${id}/check-bookings`);
      const checkData = await checkResponse.json();

      if (!checkData.success) {
        throw new Error(checkData.message);
      }

      let confirmMessage = `Er du sikker på, at du vil slette projektet "${name}"?`;

      if (checkData.count > 0) {
        const bookingDetails = checkData.bookings
          .map(
            (booking) =>
              `Booking ID: ${booking.bookingID}\n` +
              `Tidspunkt: ${new Date(
                booking.startTime
              ).toLocaleString()} - ${new Date(
                booking.endTime
              ).toLocaleString()}`
          )
          .join("\n\n");

        confirmMessage =
          `Advarsel: Følgende bookinger er knyttet til projektet "${name}":\n\n` +
          `${bookingDetails}\n\n` +
          `Disse bookinger vil blive slettet sammen med projektet.\n\n` +
          `Er du sikker på, at du vil fortsætte?`;
      }

      if (confirm(confirmMessage)) {
        const response = await fetch(`/api/projects/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          // Remove from local array and re-render
          allProjectsV2 = allProjectsV2.filter((p) => p._id !== id);
          filterAndSortProjectsV2();
          alert(`Projekt ${name} er slettet.`);
        } else {
          alert(data.message || "Kunne ikke slette projektet.");
        }
      }
    } catch (err) {
      alert("Der opstod en fejl ved sletning af projektet.");
    }
  };
}

// Load and render projects on page load
async function loadProjectsV2() {
  try {
    const response = await fetch(`/api/projects`);
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      allProjectsV2 = data.data;
      filterAndSortProjectsV2();
    } else {
      allProjectsV2 = [];
      filterAndSortProjectsV2();
    }
  } catch (err) {
    allProjectsV2 = [];
    filterAndSortProjectsV2();
  }
}
loadProjectsV2();

// API functions for project management
export async function getProjectById(id) {
  try {
    const response = await fetch(`/api/projects/${id}`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || "Kunne ikke hente projekt");
    }
  } catch (error) {
    throw new Error(`Fejl ved hentning af projekt: ${error.message}`);
  }
}

export async function deleteProject(id) {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || "Kunne ikke slette projekt");
    }
  } catch (error) {
    throw new Error(`Fejl ved sletning af projekt: ${error.message}`);
  }
}

export async function updateProject(id, projectData) {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || "Kunne ikke opdatere projekt");
    }
  } catch (error) {
    throw new Error(`Fejl ved opdatering af projekt: ${error.message}`);
  }
}

export async function createProject(projectData) {
  try {
    const response = await fetch(`/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || "Kunne ikke oprette projekt");
    }
  } catch (error) {
    throw new Error(`Fejl ved oprettelse af projekt: ${error.message}`);
  }
}
