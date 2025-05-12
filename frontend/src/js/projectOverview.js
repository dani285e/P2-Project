// Project Overview functionality
// This file handles the project management page

import { API_URL } from "./config.js";

/**
 * Fetches all projects from the API
 * @returns {Promise<Array>} Array of project objects
 */
export async function getProjects() {
  try {
    const response = await fetch(`${API_URL}/projects`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch projects");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

/**
 * Creates a new project
 * @param {Object} project - The project data to create
 * @returns {Promise<Object>} The created project
 */
export async function createProject(project) {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to create project");
    }

    return data.project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

/**
 * Deletes a project by ID
 * @param {string} id - The ID of the project to delete
 */
export async function deleteProject(id) {
  if (!confirm("Er du sikker på, at du vil slette dette projekt?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.success) {
      // Specifik håndtering af fejl ved sletning af projekt, der er i brug
      if (data.count && data.bookings) {
        const bookingsList =
          data.bookings.slice(0, 3).join(", ") +
          (data.bookings.length > 3 ? "..." : "");

        const confirmNavigate = window.confirm(
          `Dette projekt bruges i ${data.count} booking(er) (${bookingsList}).\n\n` +
            `Du skal først slette eller ændre disse bookinger, før du kan slette projektet.\n\n` +
            `Vil du navigere til bookingsoversigten for at rette dette?`
        );

        if (confirmNavigate) {
          window.location.href = "/bookings";
        }
        return;
      }

      throw new Error(data.message || "Failed to delete project");
    }

    // Refresh the project list if we're on the main page
    const projectList = document.getElementById("project-list");
    if (projectList) {
      const projects = await getProjects();
      renderProjects(projects);
    } else {
      // If we're not on the main page, redirect to it
      window.location.href = "/";
    }

    alert("Projektet er blevet slettet!");
  } catch (error) {
    console.error("Error deleting project:", error);
    alert("Der opstod en fejl ved sletning af projektet.");
  }
}

/**
 * Renders all projects to the project list element
 * @param {Array} projects - Array of project objects to render
 */
export function renderProjects(projects) {
  // Only update the tbody with id 'project-list-body'
  const tbody = document.getElementById("project-list-body");
  if (!tbody) return;

  if (!projects.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">Ingen projekter fundet.</td></tr>`;
    return;
  }

  let html = "";
  projects.forEach((project) => {
    const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString("da-DK") : "-";
    const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString("da-DK") : "-";
    html += `
      <tr>
        <td>${project.projectID || "-"}</td>
        <td>${project.name || "-"}</td>
        <td>${project.customer || "-"}</td>
        <td>${startDate}</td>
        <td>${deadline}</td>
        <td>${project.price != null ? project.price.toLocaleString("da-DK") + ' kr.' : "-"}</td>
        <td>${project.isClassProject ? "Ja" : "Nej"}</td>
        <td class="d-flex gap-1 align-items-center">
          <button class="btn btn-primary btn-sm btn-view me-1" data-id="${project._id}"><i class="bi bi-eye"></i> Vis</button>
          <button class="btn btn-warning btn-sm btn-edit me-1" data-id="${project._id}"><i class="bi bi-pencil"></i> Rediger</button>
          <button class="btn btn-danger btn-sm btn-delete" data-id="${project._id}"><i class="bi bi-trash"></i> Slet</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;

  // Add event listeners to buttons
  tbody.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof window.viewProject === "function") {
        window.viewProject(btn.dataset.id);
      } else {
        console.log(`View project with ID: ${btn.dataset.id}`);
      }
    });
  });
  tbody.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof window.editProject === "function") {
        window.editProject(btn.dataset.id);
      } else {
        console.log(`Edit project with ID: ${btn.dataset.id}`);
      }
    });
  });
  tbody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteProject(btn.dataset.id));
  });
}

/**
 * Initializes the project form with event listeners
 */
export function initProjectForm() {
  const projectForm = document.getElementById("project-form");
  if (!projectForm) return;

  // For createProject.html, set up the classProject checkbox handler
  const classProjectCheckbox = document.getElementById("isClassProject");
  const inspectionSection = document.getElementById("inspection-section");

  if (
    classProjectCheckbox &&
    inspectionSection &&
    location.pathname.includes("createProject.html")
  ) {
    classProjectCheckbox.addEventListener("change", () => {
      if (classProjectCheckbox.checked) {
        inspectionSection.classList.remove("hidden");
      } else {
        inspectionSection.classList.add("hidden");
      }
    });
  }

  // Show/hide date fields for inspections
  const inspectionCheckboxes = document.querySelectorAll(
    ".inspection-checkbox"
  );

  inspectionCheckboxes.forEach((checkbox) => {
    const dateField = document.getElementById(`${checkbox.id}Date`);
    if (dateField) {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          dateField.parentElement.classList.remove("hidden");
        } else {
          dateField.parentElement.classList.add("hidden");
        }
      });
    }
  });
}

/**
 * Fetches a single project by ID
 * @param {string} id - The ID of the project to fetch
 * @returns {Promise<Object>} The project object
 */
export async function getProjectById(id) {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch project");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
}

/**
 * Updates an existing project
 * @param {string} id - The ID of the project to update
 * @param {Object} project - The updated project data
 * @returns {Promise<Object>} The updated project
 */
export async function updateProject(id, project) {
  try {
    const response = await fetch(`${API_URL}/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to update project");
    }

    return data.data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

// Function to initialize the project overview page
export function initProjectOverview() {
  // Initialize the project form
  initProjectForm();

  // Load projects on page load
  const projectList = document.getElementById("project-list");
  if (projectList) {
    getProjects().then((projects) => {
      renderProjects(projects);
    });
  }
}

// Auto-initialize project overview if on the correct page
if (document.getElementById("project-list")) {
  initProjectOverview();
}

// --- v2 Project Table Event Listeners and Handlers ---

export function renderProjectsV2(projects) {
  const tbody = document.getElementById("project-list-body-v2");
  if (!tbody) return;
  if (!projects || projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan='8' class='text-muted text-center'>Ingen projekter fundet.</td></tr>`;
    return;
  }
  let html = "";
  projects.forEach((project) => {
    const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString("da-DK") : "-";
    const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString("da-DK") : "-";
    html += `
      <tr>
        <td>${project.projectID || "-"}</td>
        <td>${project.name || "-"}</td>
        <td>${project.customer || "-"}</td>
        <td>${startDate}</td>
        <td>${deadline}</td>
        <td>${project.price != null ? project.price.toLocaleString("da-DK") + ' kr.' : "-"}</td>
        <td>${project.isClassProject ? "Ja" : "Nej"}</td>
        <td class="d-flex gap-1 align-items-center">
          <button type="button" class="btn btn-info btn-sm btn-view-v2" data-id="${project._id}"><i class="bi bi-eye"></i> Vis</button>
          <button type="button" class="btn btn-warning btn-sm btn-edit-v2" data-id="${project._id}"><i class="bi bi-pencil"></i> Rediger</button>
          <button type="button" class="btn btn-danger btn-sm btn-delete-v2" data-id="${project._id}" data-name="${project.name}"><i class="bi bi-trash"></i> Slet</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  // DEBUG: Adding event listeners for v2 buttons
  console.debug('[renderProjectsV2] Adding event listeners for .btn-view-v2, .btn-edit-v2, .btn-delete-v2');
  tbody.querySelectorAll(".btn-view-v2").forEach((btn) => {
    btn.addEventListener("click", () => {
      console.debug('[btn-view-v2] Clicked', btn.dataset.id, typeof window.viewProject);
      if (typeof window.viewProject === "function") {
        window.viewProject(btn.dataset.id);
      } else {
        console.warn("window.viewProject is not a function", btn.dataset.id);
      }
    });
  });
  tbody.querySelectorAll(".btn-edit-v2").forEach((btn) => {
    btn.addEventListener("click", () => {
      console.debug('[btn-edit-v2] Clicked', btn.dataset.id, typeof window.editProject);
      if (typeof window.editProject === "function") {
        window.editProject(btn.dataset.id);
      } else {
        console.warn("window.editProject is not a function", btn.dataset.id);
      }
    });
  });
  tbody.querySelectorAll(".btn-delete-v2").forEach((btn) => {
    btn.addEventListener("click", () => {
      console.debug('[btn-delete-v2] Clicked', btn.dataset.id, btn.dataset.name, typeof window.handleDeleteProject);
      if (typeof window.handleDeleteProject === "function") {
        window.handleDeleteProject(btn.dataset.id, btn.dataset.name);
      } else {
        console.warn("window.handleDeleteProject is not a function", btn.dataset.id, btn.dataset.name);
      }
    });
  });
}

if (typeof window.viewProject !== "function") {
  window.viewProject = function(id) {
    window.location.href = `/src/pages/viewProject.html?id=${id}`;
  };
}
if (typeof window.editProject !== "function") {
  window.editProject = function(id) {
    window.location.href = `/src/pages/editProject.html?id=${id}`;
  };
}
if (typeof window.handleDeleteProject !== "function") {
  window.handleDeleteProject = function(id, name) {
    if (confirm(`Er du sikker på, at du vil slette projektet "${name}"?`)) {
      alert(`Projekt ${name} (ID: ${id}) ville blive slettet her.`);
    }
  };
}
