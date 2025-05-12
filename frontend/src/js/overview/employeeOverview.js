import {
  getEmployees,
  deleteEmployee,
} from "../services/employeeService.js";

window.viewEmployee = (id) => {
  window.location.href = `/viewEmployee?id=${id}`;
};
window.editEmployee = (id) => {
  window.location.href = `/editEmployee?id=${id}`;
};

let allEmployees = [];
let sortField = "employeeNumber";
let sortDirection = "asc";
let searchQuery = "";

function updateSortButtonText() {
  const sortIcon = document.getElementById("sort-icon");
  if (sortDirection === "asc") {
    sortIcon.className = "bi bi-sort-alpha-down";
  } else {
    sortIcon.className = "bi bi-sort-alpha-up";
  }
}

function renderEmployeeList(employees) {
  const tbody = document.getElementById("employee-list-body");
  if (employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan='3' class='text-muted text-center'>Ingen medarbejdere fundet.</td></tr>`;
    return;
  }
  let html = "";
  employees.forEach((employee) => {
    html += `
      <tr>
        <td>${employee.employeeNumber || "-"}</td>
        <td>${employee.name || "-"}</td>
        <td>
          <div class="btn-group" role="group">
          <button class="btn btn-info btn-sm btn-view-v2 me-1" data-id="${employee._id}"><i class="bi bi-eye"></i> Vis</button>
          <button class="btn btn-warning btn-sm btn-edit-v2 me-1" data-id="${employee._id}"><i class="bi bi-pencil"></i> Rediger</button>
          <button class="btn btn-danger btn-sm btn-delete-v2" data-id="${employee._id}" data-name="${employee.name}"><i class="bi bi-trash"></i> Slet</button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

async function handleDeleteEmployee(id, name) {
  const confirmDelete = window.confirm(`Er du sikker på, at du vil slette medarbejderen \"${name}\"?`);
  if (!confirmDelete) return;
  try {
    const success = await deleteEmployee(id);
    if (success) {
      allEmployees = await getEmployees();
      filterAndSortEmployees();
      alert("Medarbejderen er blevet slettet");
    } else {
      alert("Kunne ikke slette medarbejderen");
    }
  } catch (error) {
    alert("Der opstod en fejl ved sletning: " + error.message);
  }
}

function filterAndSortEmployees() {
  let filteredEmployees = [...allEmployees];
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredEmployees = filteredEmployees.filter(
      (employee) =>
        (employee.employeeNumber && employee.employeeNumber.toLowerCase().includes(query)) ||
        (employee.name && employee.name.toLowerCase().includes(query))
    );
  }
  filteredEmployees.sort((a, b) => {
    const valA = (a[sortField] || "").toString();
    const valB = (b[sortField] || "").toString();
    const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
    return sortDirection === "asc" ? comparison : -comparison;
  });
  renderEmployeeList(filteredEmployees);
  document.querySelectorAll(".btn-view-v2").forEach((btn) => {
    btn.addEventListener("click", () => window.viewEmployee(btn.dataset.id));
  });
  document.querySelectorAll(".btn-edit-v2").forEach((btn) => {
    btn.addEventListener("click", () => window.editEmployee(btn.dataset.id));
  });
  document.querySelectorAll(".btn-delete-v2").forEach((btn) => {
    btn.addEventListener("click", () => handleDeleteEmployee(btn.dataset.id, btn.dataset.name));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  allEmployees = await getEmployees();
  filterAndSortEmployees();
  updateSortButtonText();
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchQuery = searchInput.value.trim();
      filterAndSortEmployees();
    }
  });
  searchButton.addEventListener("click", () => {
    searchQuery = searchInput.value.trim();
    filterAndSortEmployees();
  });
  const sortFieldSelect = document.getElementById("sort-field");
  const sortDirectionButton = document.getElementById("sort-direction");
  sortFieldSelect.addEventListener("change", () => {
    sortField = sortFieldSelect.value;
    sortDirection = "asc";
    updateSortButtonText();
    filterAndSortEmployees();
  });
  sortDirectionButton.addEventListener("click", () => {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
    updateSortButtonText();
    filterAndSortEmployees();
  });
});

// Optional: API test function for debugging
async function testAPI() {
  try {
    console.log("Testing API call to /api/employees");
    const response = await fetch("/api/employees");
    const responseText = await response.text();

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    console.log("Raw response text:", responseText);

    try {
      const data = JSON.parse(responseText);
      console.log("Parsed data:", data);

      if (data.success && data.data) {
        console.log("Number of employees:", data.data.length);
      }
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
}

window.addEventListener("load", testAPI);
