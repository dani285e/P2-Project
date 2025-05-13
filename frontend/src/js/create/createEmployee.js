import { createEmployee } from "../services/employeeService.js";

let skills = [];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-employee-form");
  const skillsList = document.getElementById("skills-list");
  const skillInput = document.getElementById("skill-input");
  const addSkillButton = document.getElementById("add-skill");

  function renderSkills() {
    skillsList.innerHTML = "";

    if (skills.length === 0) {
      skillsList.innerHTML =
        "<p class='text-muted'>Ingen færdigheder tilføjet endnu.</p>";
      return;
    }

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

    document.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = parseInt(button.dataset.index, 10);
        skills = skills.filter((_, i) => i !== index);
        renderSkills();
      });
    });
  }

  renderSkills();

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
      document.getElementById("employeeNumber-error").textContent =
        "Medarbejdernummer er påkrævet.";
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
      await createEmployee(employee);
      alert("Medarbejder oprettet succesfuldt!");
      form.reset();
      skills = [];
      renderSkills();
      window.location.href = "/employees";
    } catch (error) {
      console.error("Error creating employee:", error);
      alert(
        "Der opstod en fejl ved oprettelse af medarbejderen. Prøv igen senere."
      );
    }
  });
});
