// Employee Service
// This file handles API calls for employee management

import { API_URL } from "./config.js";

/**
 * Fetches all employees from the API
 * @returns {Promise<Array>} Array of employee objects
 */
export async function getEmployees() {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch employees");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

/**
 * Fetches a single employee by ID
 * @param {string} id - The ID of the employee to fetch
 * @returns {Promise<Object>} The employee object
 */
export async function getEmployeeById(id) {
  try {
    const response = await fetch(`${API_URL}/employees/${id}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch employee");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching employee:", error);
    throw error;
  }
}

/**
 * Creates a new employee
 * @param {Object} employee - The employee data to create
 * @returns {Promise<Object>} The created employee
 */
export async function createEmployee(employee) {
  try {
    const response = await fetch(`${API_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employee),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to create employee");
    }

    return data.employee;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
}

/**
 * Updates an existing employee
 * @param {string} id - The ID of the employee to update
 * @param {Object} employee - The updated employee data
 * @returns {Promise<Object>} The updated employee
 */
export async function updateEmployee(id, employee) {
  try {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employee),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to update employee");
    }

    return data.data;
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
}

/**
 * Deletes an employee by ID
 * @param {string} id - The ID of the employee to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
export async function deleteEmployee(id) {
  try {
    if (!confirm("Er du sikker på, at du vil slette denne medarbejder?")) {
      return false;
    }

    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!data.success) {
      // Specifik håndtering af fejl ved sletning af medarbejder der er i brug
      if (data.count && data.bookings) {
        const bookingsList =
          data.bookings.slice(0, 3).join(", ") +
          (data.bookings.length > 3 ? "..." : "");

        const confirmNavigate = window.confirm(
          `Denne medarbejder er tilknyttet ${data.count} booking(er) (${bookingsList}).\n\n` +
            `Du skal først fjerne medarbejderen fra disse bookinger, før du kan slette medarbejderen.\n\n` +
            `Vil du navigere til bookingsoversigten for at rette dette?`
        );

        if (confirmNavigate) {
          window.location.href = "/bookings";
        }
        return false;
      }

      throw new Error(data.message || "Failed to delete employee");
    }

    return true;
  } catch (error) {
    console.error("Error deleting employee:", error);
    alert("Der opstod en fejl ved sletning af medarbejderen.");
    return false;
  }
}

/**
 * Renders all employees to the employee list element
 * @param {Array} employees - Array of employee objects to render
 * @param {HTMLElement} targetElement - Element to render employees to
 */
export function renderEmployees(employees, targetElement) {
  if (!targetElement) return;

  targetElement.innerHTML = "";

  if (!employees.length) {
    targetElement.innerHTML = "<p>Ingen medarbejdere fundet.</p>";
    return;
  }

  const table = document.createElement("table");
  table.classList.add("employee-table");

  // Create table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Medarbejdernummer</th>
      <th>Navn</th>
      <th>Færdigheder</th>
      <th>Handlinger</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement("tbody");

  employees.forEach((employee) => {
    const row = document.createElement("tr");

    // Format skills as a comma-separated list
    const skills = employee.skills ? employee.skills.join(", ") : "";

    row.innerHTML = `
      <td>${employee.employeeNumber}</td>
      <td>${employee.name}</td>
      <td>${skills}</td>
      <td>
        <button class="btn-view" data-id="${employee._id}">Vis</button>
        <button class="btn-edit" data-id="${employee._id}">Rediger</button>
        <button class="btn-delete" data-id="${employee._id}">Slet</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  targetElement.appendChild(table);
}
