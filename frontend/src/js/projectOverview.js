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
      renderProjects(projects, projectList);
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
 * @param {HTMLElement} targetElement - Element to render projects to
 */
export function renderProjects(projects, targetElement) {
  if (!targetElement) return;

  targetElement.innerHTML = "";

  if (!projects.length) {
    targetElement.innerHTML = "<p>Ingen projekter fundet.</p>";
    return;
  }

  const table = document.createElement("table");
  table.classList.add("project-table");

  // Create table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Projekt ID</th>
      <th>Navn</th>
      <th>Kunde</th>
      <th>Startdato</th>
      <th>Deadline</th>
      <th>Pris</th>
      <th>Klasseprojekt</th>
      <th>Handlinger</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement("tbody");

  projects.forEach((project) => {
    const row = document.createElement("tr");

    // Format dates
    const startDate = new Date(project.startDate).toLocaleDateString("da-DK");
    const deadline = new Date(project.deadline).toLocaleDateString("da-DK");

    row.innerHTML = `
      <td>${project.projectID}</td>
      <td>${project.name}</td>
      <td>${project.customer}</td>
      <td>${startDate}</td>
      <td>${deadline}</td>
      <td>${project.price.toLocaleString("da-DK")} kr.</td>
      <td>${project.isClassProject ? "Ja" : "Nej"}</td>
      <td>
        <button class="btn-view" data-id="${project._id}">Vis</button>
        <button class="btn-edit" data-id="${project._id}">Rediger</button>
        <button class="btn-delete" data-id="${project._id}">Slet</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  targetElement.appendChild(table);

  // Add event listeners to buttons
  targetElement.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof window.viewProject === "function") {
        window.viewProject(btn.dataset.id);
      } else {
        console.log(`View project with ID: ${btn.dataset.id}`);
        // TODO: Implement project view functionality
      }
    });
  });

  targetElement.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (typeof window.editProject === "function") {
        window.editProject(btn.dataset.id);
      } else {
        console.log(`Edit project with ID: ${btn.dataset.id}`);
        // TODO: Implement project edit functionality
      }
    });
  });

  targetElement.querySelectorAll(".btn-delete").forEach((btn) => {
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
      renderProjects(projects, projectList);
    });
  }
}
