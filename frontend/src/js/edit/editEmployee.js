import {
  getEmployeeById,
  updateEmployee,
} from "../employeeService.js";

const urlParams = new URLSearchParams(window.location.search);
const employeeId = urlParams.get("id");

if (!employeeId) {
  alert("Ingen medarbejder-ID angivet.");
  window.location.href = "/employees";
}

let skills = [];

const form = document.getElementById("edit-employee-form");
const loadingDiv = document.getElementById("loading");
const skillsList = document.getElementById("skills-list");
const skillInput = document.getElementById("skill-input");
const addSkillButton = document.getElementById("add-skill");

function renderSkills() {
  skillsList.innerHTML = "";

  if (skills.length === 0) {
    skillsList.innerHTML = "<p class='text-muted'>Ingen færdigheder tilføjet endnu.</p>";
    return;
  }

  skills.forEach((skill, index) => {
    const skillItem = document.createElement("div");
    skillItem.classList.add("badge", "bg-info", "text-dark", "d-flex", "align-items-center", "gap-2");
    skillItem.innerHTML = `${skill} <span class='text-danger' style='cursor: pointer;' data-index='${index}'>×</span>`;
    skillsList.appendChild(skillItem);
  });

  document.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index, 10);
      skills = skills.filter((_, i) => i !== index);
      renderSkills();
    });
  });
}

function addSkill() {
  const skill = skillInput.value.trim();

  if (skill && !skills.includes(skill)) {
    skills.push(skill);
    skillInput.value = "";
    document.getElementById("skills-error").textContent = "";
    renderSkills();
  } else if (skills.includes(skill)) {
    document.getElementById("skills-error").textContent = "Denne færdighed er allerede tilføjet.";
  }
}

async function loadEmployeeData() {
  try {
    const employee = await getEmployeeById(employeeId);

    document.getElementById("employeeNumber").value =
      employee.employeeNumber || "";
    document.getElementById("name").value = employee.name || "";

    skills = employee.skills || [];
    renderSkills();

    loadingDiv.style.display = "none";
    form.classList.remove("d-none");
  } catch (error) {
    console.error("Error loading employee:", error);
    alert("Der opstod en fejl ved indlæsning af medarbejderdata.");
    window.location.href = "/employees";
  }
}

document.addEventListener("DOMContentLoaded", loadEmployeeData);

addSkillButton.addEventListener("click", addSkill);

skillInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addSkill();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  document.querySelectorAll(".text-danger").forEach((el) => {
    el.textContent = "";
  });

  const employeeNumber = document
    .getElementById("employeeNumber")
    .value.trim();
  const name = document.getElementById("name").value.trim();

  let isValid = true;

  if (!employeeNumber) {
    document.getElementById("employeeNumber-error").textContent = "Medarbejdernummer er påkrævet.";
    isValid = false;
  }

  if (!name) {
    document.getElementById("name-error").textContent = "Navn er påkrævet.";
    isValid = false;
  }

  if (!isValid) return;

  const employee = {
    employeeNumber,
    name,
    skills,
  };

  try {
    await updateEmployee(employeeId, employee);
    window.location.href = "/employees";
  } catch (error) {
    console.error("Error updating employee:", error);
    alert("Der opstod en fejl ved opdatering af medarbejderen. Prøv igen senere.");
  }
});
