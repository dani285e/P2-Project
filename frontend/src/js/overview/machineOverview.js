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

let allMachines = [];
let searchQuery = "";
let sortField = "machineID";
let sortDirection = "asc";

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

    // Sorter maskiner efter navn
    machines.sort((a, b) => a.name.localeCompare(b.name, "da"));

    console.log("Indlæste maskiner:", machines);
    allMachines = machines;

    // Opdater sorteringsindstillinger
    sortField = "name";
    sortDirection = "asc";
    if (document.getElementById("sort-field")) {
      document.getElementById("sort-field").value = "name";
    }
    updateSortButtonText();

    filterAndSortMachines();
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
    // First check for affected bookings
    const checkResponse = await fetch(
      `${API_URL}/machines/${id}/check-bookings`
    );
    const checkResult = await checkResponse.json();

    if (!checkResult.success) {
      throw new Error(
        checkResult.message || "Der opstod en fejl ved tjek af bookinger"
      );
    }

    // If there are affected bookings, show a warning with booking details
    if (checkResult.count > 0) {
      const bookingDetails = checkResult.bookings
        .map(
          (booking) =>
            `Booking ID: ${booking.bookingID}\n` +
            `Tidspunkt: ${new Date(
              booking.startTime
            ).toLocaleString()} - ${new Date(booking.endTime).toLocaleString()}`
        )
        .join("\n\n");

      const confirmDelete = window.confirm(
        `Advarsel: Følgende bookinger er knyttet til maskinen "${name}":\n\n` +
          `${bookingDetails}\n\n` +
          `Disse bookinger vil blive slettet sammen med maskinen.\n\n` +
          `Er du sikker på, at du vil fortsætte?`
      );

      if (!confirmDelete) return;
    } else {
      // If no bookings are affected, show the normal confirmation
      const confirmDelete = window.confirm(
        `Er du sikker på, at du vil slette maskinen "${name}"?`
      );

      if (!confirmDelete) return;
    }

    // Proceed with deletion
    const response = await fetch(`${API_URL}/machines/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Der opstod en fejl");
    }

    loadMachines();
    alert("Maskinen er blevet slettet");
  } catch (error) {
    console.error("Fejl ved sletning af maskine:", error);
    alert(`Der opstod en fejl ved sletning: ${error.message}`);
  }
}

function updateSortButtonText() {
  const sortIcon = document.getElementById("sort-icon");
  if (sortDirection === "asc") {
    sortIcon.className = "bi bi-sort-alpha-down";
  } else {
    sortIcon.className = "bi bi-sort-alpha-up";
  }
}

function filterAndSortMachines() {
  let filteredMachines = [...allMachines];
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredMachines = filteredMachines.filter((machine) => {
      return machine.name && machine.name.toLowerCase().includes(query);
    });
  }

  filteredMachines.sort((a, b) => {
    const valA = (a[sortField] || "").toString();
    const valB = (b[sortField] || "").toString();
    const comparison = valA.localeCompare(valB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    return sortDirection === "asc" ? comparison : -comparison;
  });

  renderMachineList(filteredMachines);
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const sortFieldSelect = document.getElementById("sort-field");
  const sortDirectionButton = document.getElementById("sort-direction");

  // Lyt efter custom event når maskinernes rækkefølge ændres
  document.addEventListener("machineOrderUpdated", () => {
    loadMachines();
  });

  // Only add search listeners if search elements exist
  if (searchInput && searchButton) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchQuery = searchInput.value.trim();
        filterAndSortMachines();
      }
    });
    searchButton.addEventListener("click", () => {
      searchQuery = searchInput.value.trim();
      filterAndSortMachines();
    });
  }

  // Only add sort listeners if sort elements exist
  if (sortFieldSelect && sortDirectionButton) {
    sortFieldSelect.addEventListener("change", () => {
      sortField = sortFieldSelect.value;
      sortDirection = "asc";
      updateSortButtonText();
      filterAndSortMachines();
    });
    sortDirectionButton.addEventListener("click", () => {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
      updateSortButtonText();
      filterAndSortMachines();
    });
  }
});

window.editMachine = editMachine;
window.deleteMachine = deleteMachine;
