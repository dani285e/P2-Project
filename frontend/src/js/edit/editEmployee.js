// Import employee service functions for fetching and updating employee data
import {
  getEmployeeById,
  updateEmployee,
} from "../services/employeeService.js";

// Get employee ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const employeeId = urlParams.get("id");

// Redirect if no employee ID is provided
if (!employeeId) {
  alert("Ingen medarbejder-ID angivet.");
  window.location.href = "/employees";
}

// Array to store employee skills
let skills = [];

// Get DOM elements
const form = document.getElementById("edit-employee-form");
const loadingDiv = document.getElementById("loading");
const skillsList = document.getElementById("skills-list");
const skillInput = document.getElementById("skill-input");
const addSkillButton = document.getElementById("add-skill");

// Function to render the skills list with delete functionality
function renderSkills() {
  skillsList.innerHTML = "";

  if (skills.length === 0) {
    skillsList.innerHTML =
      "<p class='text-muted'>Ingen færdigheder tilføjet endnu.</p>";
    return;
  }

  // Create and append skill badges with delete buttons
  skills.forEach((skill, index) => {
    const skillItem = document.createElement("div");
    skillItem.classList.add(
      "badge",
      "bg-info",
      "text-dark",
      "d-flex",
      "align-items-center",
      "gap-2"
    );
    skillItem.innerHTML = `${skill} <span class='text-danger' style='cursor: pointer;' data-index='${index}'>×</span>`;
    skillsList.appendChild(skillItem);
  });

  // Add click event listeners to delete buttons
  document.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index, 10);
      skills = skills.filter((_, i) => i !== index);
      renderSkills();
    });
  });
}

// Function to add a new skill to the list
function addSkill() {
  const skill = skillInput.value.trim();

  if (skill && !skills.includes(skill)) {
    skills.push(skill);
    skillInput.value = "";
    document.getElementById("skills-error").textContent = "";
    renderSkills();
  } else if (skills.includes(skill)) {
    document.getElementById("skills-error").textContent =
      "Denne færdighed er allerede tilføjet.";
  }
}

// Function to load existing employee data
async function loadEmployeeData() {
  try {
    const employee = await getEmployeeById(employeeId);

    // Populate form fields with employee data
    document.getElementById("employeeNumber").value =
      employee.employeeNumber || "";
    document.getElementById("name").value = employee.name || "";

    skills = employee.skills || [];
    renderSkills();

    // Show form and hide loading indicator
    loadingDiv.style.display = "none";
    form.classList.remove("d-none");
  } catch (error) {
    console.error("Error loading employee:", error);
    alert("Der opstod en fejl ved indlæsning af medarbejderdata.");
    window.location.href = "/employees";
  }
}

// Load employee data when DOM is ready
document.addEventListener("DOMContentLoaded", loadEmployeeData);

// Event listeners for adding skills
addSkillButton.addEventListener("click", addSkill);

skillInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addSkill();
  }
});

// Form submission handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear previous error messages
  document.querySelectorAll(".text-danger").forEach((el) => {
    el.textContent = "";
  });

  // Get form values
  const employeeNumber = document.getElementById("employeeNumber").value.trim();
  const name = document.getElementById("name").value.trim();

  let isValid = true;

  // Validate required fields
  if (!employeeNumber) {
    document.getElementById("employeeNumber-error").textContent =
      "Medarbejdernummer er påkrævet.";
    isValid = false;
  }

  if (!name) {
    document.getElementById("name-error").textContent = "Navn er påkrævet.";
    isValid = false;
  }

  if (!isValid) return;

  // Create employee object with updated data
  const employee = {
    employeeNumber,
    name,
    skills,
  };

  try {
    // Submit updated employee data to the server
    await updateEmployee(employeeId, employee);
    window.location.href = "/employees";
  } catch (error) {
    console.error("Error updating employee:", error);
    alert(
      "Der opstod en fejl ved opdatering af medarbejderen. Prøv igen senere."
    );
  }
});
