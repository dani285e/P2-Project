const machineList = document.getElementById("machine-list");
const createMachineBtn = document.getElementById("createMachineBtn");
const machineModal = new bootstrap.Modal(
  document.getElementById("machineModal")
);
const machineForm = document.getElementById("machineForm");
const modalTitle = document.getElementById("modalTitle");
const machineId = document.getElementById("machineId");
const machineName = document.getElementById("machineName");

createMachineBtn.addEventListener("click", openCreateModal);
machineForm.addEventListener("submit", saveMachine);
document.addEventListener("DOMContentLoaded", loadMachines);

const API_URL = "/api";

async function loadMachines() {
  try {
    const response = await fetch(`${API_URL}/machines`);
    const result = await response.json();

    let machines = [];
    if (result.success && Array.isArray(result.data)) {
      machines = result.data;
    } else if (Array.isArray(result)) {
      machines = result;
    } else {
      throw new Error("Uventet dataformat returneret fra API");
    }

    renderMachineList(machines);
  } catch (error) {
    console.error("Fejl ved hentning af maskiner:", error);
    machineList.innerHTML = `<p class="text-danger">Der opstod en fejl ved hentning af maskiner: ${error.message}</p>`;
  }
}

function renderMachineList(machines) {
  if (machines.length === 0) {
    machineList.innerHTML =
      "<p class='text-muted text-center'>Ingen maskiner fundet. Opret en ny maskine for at komme i gang.</p>";
    return;
  }

  let html = `
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Navn</th>
          <th>Status</th>
          <th>Handlinger</th>
        </tr>
      </thead>
      <tbody>
  `;

  machines.forEach((machine) => {
    const statusClass =
      machine.status === "Ledig"
        ? "bg-success text-white"
        : "bg-danger text-white";

    html += `
      <tr>
        <td>${machine.name}</td>
        <td><span class="badge ${statusClass}">${machine.status}</span></td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editMachine('${machine._id}', '${machine.name}')">Rediger</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMachine('${machine._id}', '${machine.name}')">Slet</button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  machineList.innerHTML = html;
}

function openCreateModal() {
  modalTitle.textContent = "Opret Ny Maskine";
  machineId.value = "";
  machineName.value = "";
  machineModal.show();
}

function editMachine(id, name) {
  modalTitle.textContent = "Rediger Maskine";
  machineId.value = id;
  machineName.value = name;
  machineModal.show();
}

async function saveMachine(e) {
  e.preventDefault();

  const machineData = {
    name: machineName.value,
  };

  const isEditing = machineId.value !== "";

  try {
    let response;

    if (isEditing) {
      response = await fetch(`${API_URL}/machines/${machineId.value}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(machineData),
      });
    } else {
      response = await fetch(`${API_URL}/machines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(machineData),
      });
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Der opstod en fejl");
    }

    machineModal.hide();
    loadMachines();

    const message = isEditing
      ? "Maskinen er blevet opdateret"
      : "Ny maskine er blevet oprettet";
    alert(message);
  } catch (error) {
    console.error("Fejl ved gem maskine:", error);
    alert(`Der opstod en fejl: ${error.message}`);
  }
}

async function deleteMachine(id, name) {
  try {
    // Tjek først antal bookinger
    const checkResponse = await fetch(`/api/machines/${id}/check-bookings`);
    const checkData = await checkResponse.json();

    if (!checkData.success) {
      throw new Error(checkData.message);
    }

    let confirmMessage = `Er du sikker på, at du vil slette maskinen "${name}"?`;

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
      const response = await fetch(`${API_URL}/machines/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Der opstod en fejl");
      }

      loadMachines();
      alert("Maskinen er blevet slettet");
    }
  } catch (error) {
    console.error("Fejl ved sletning af maskine:", error);
    alert(`Der opstod en fejl ved sletning: ${error.message}`);
  }
}

window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
