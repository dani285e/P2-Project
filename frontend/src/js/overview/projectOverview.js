let allProjectsV2 = [];
let sortFieldV2 = "projectID";
let sortDirectionV2 = "asc";
let searchQueryV2 = "";

function updateSortButtonTextV2() {
  const sortIcon = document.getElementById("sort-icon");
  if (sortDirectionV2 === "asc") {
    sortIcon.className = "bi bi-sort-alpha-down";
  } else {
    sortIcon.className = "bi bi-sort-alpha-up";
  }
}

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

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const sortFieldSelect = document.getElementById("sort-field");
  const sortDirectionButton = document.getElementById("sort-direction");

  // Only add search listeners if search elements exist
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

  // Only add sort listeners if sort elements exist
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

// Render function v2 for the new table
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
          project.isClassProject ? "Ja" : "Nej"
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
  // Add event listeners for v2 buttons
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

// Add global functions for button actions if not already defined
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
      // Tjek først antal bookinger
      const checkResponse = await fetch(`/api/projects/${id}/check-bookings`);
      const checkData = await checkResponse.json();

      if (!checkData.success) {
        throw new Error(checkData.message);
      }

      let confirmMessage = `Er du sikker på, at du vil slette projektet "${name}"?`;

      if (checkData.count > 0) {
        confirmMessage += `\n\nADVARSEL: Dette vil også slette ${checkData.count} tilknyttede booking(er):\n`;
        checkData.bookings.forEach((booking) => {
          const startDate = new Date(booking.startTime).toLocaleDateString(
            "da-DK"
          );
          const endDate = new Date(booking.endTime).toLocaleDateString("da-DK");
          confirmMessage += `\n- Booking ${booking.bookingID}: ${startDate} til ${endDate}`;
        });
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

// Fetch and render data for the v2 table on page load
const API_URL = "/api"; // Use your actual API base path here
async function loadProjectsV2() {
  try {
    const response = await fetch(`${API_URL}/projects`);
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

// API functions
export async function getProjectById(id) {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`);
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
    const response = await fetch(`${API_URL}/projects/${id}`, {
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
    const response = await fetch(`${API_URL}/projects/${id}`, {
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
    const response = await fetch(`${API_URL}/projects`, {
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
