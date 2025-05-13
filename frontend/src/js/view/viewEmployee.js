// Moved all script logic from viewEmployee.html to this file
import {
  getEmployeeById,
  deleteEmployee,
} from "../services/employeeService.js";

// Helper to render employee details
function renderEmployeeDetails(employee) {
  const employeeDetailsElement = document.getElementById("employee-details");

  // Render skills list
  let skillsHtml = "<p class='text-muted'>Ingen færdigheder registreret</p>";
  if (employee.skills && employee.skills.length > 0) {
    skillsHtml = `
      <ul class="list-inline">
        ${employee.skills
          .map(
            (skill) =>
              `<li class="list-inline-item badge bg-info text-dark">${skill}</li>`
          )
          .join("")}
      </ul>
    `;
  }

  employeeDetailsElement.innerHTML = `
    <dl class="row">
      <dt class="col-sm-4">Medarbejdernummer</dt>
      <dd class="col-sm-8">${employee.employeeNumber}</dd>

      <dt class="col-sm-4">Navn</dt>
      <dd class="col-sm-8">${employee.name}</dd>

      <dt class="col-sm-4">Færdigheder</dt>
      <dd class="col-sm-8">${skillsHtml}</dd>

      <dt class="col-sm-4">Oprettet</dt>
      <dd class="col-sm-8">${new Date(employee.createdAt).toLocaleString(
        "da-DK"
      )}</dd>

      <dt class="col-sm-4">Sidst opdateret</dt>
      <dd class="col-sm-8">${new Date(employee.updatedAt).toLocaleString(
        "da-DK"
      )}</dd>
    </dl>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Get employee ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = urlParams.get("id");

  if (!employeeId) {
    alert("Ingen medarbejder-ID angivet!");
    window.location.href = "/employees";
    return;
  }

  try {
    // Fetch employee details
    const employee = await getEmployeeById(employeeId);
    renderEmployeeDetails(employee);

    // Set up button event listeners
    document.getElementById("btn-edit").addEventListener("click", () => {
      window.location.href = `/editEmployee?id=${employeeId}`;
    });

    document
      .getElementById("btn-delete")
      .addEventListener("click", async () => {
        if (await deleteEmployee(employeeId)) {
          window.location.href = "/employees";
        }
      });
  } catch (error) {
    alert(`Fejl ved indlæsning af medarbejder: ${error.message}`);
    window.location.href = "/employees";
  }
});
