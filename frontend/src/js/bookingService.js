// Booking Service
// Dette script håndterer bookingsfunktionalitet og API-kald til backend

import { API_URL } from "./config.js";

// DOM-elementer
const bookingTimeline = document.getElementById("bookingTimeline");
const currentDateRangeSpan = document.getElementById("currentDateRange");
const bookingAlert = document.getElementById("bookingAlert");

// Tilstand
let machines = [];
let projects = [];
let employees = [];
let bookings = [];
let selectedEmployees = [];
let currentStartDate = new Date();
let isEditing = false;
let editingBookingId = null;

// Formatter datoer
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
  });
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeOnly = (date) => {
  return new Date(date).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Indstil starten af ugen (søndag eller mandag)
const getStartOfWeek = (date) => {
  const newDate = new Date(date);
  const day = newDate.getDay(); // 0 for søndag, 1 for mandag, ...
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Juster til mandag (tilføj -6 hvis det er søndag)
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Hent 7 dage fra startdatoen
const getDaysInWeek = (startDate) => {
  const days = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

// Opdater datointerval visning
const updateDateRangeDisplay = () => {
  const startOfWeek = getStartOfWeek(currentStartDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  currentDateRangeSpan.textContent = `${formatDate(startOfWeek)} - ${formatDate(
    endOfWeek
  )}`;
};

// Naviger til forrige uge
const goToPrevWeek = () => {
  const startOfWeek = getStartOfWeek(currentStartDate);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  currentStartDate = startOfWeek;
  updateDateRangeDisplay();
  renderTimeline();
};

// Naviger til næste uge
const goToNextWeek = () => {
  const startOfWeek = getStartOfWeek(currentStartDate);
  startOfWeek.setDate(startOfWeek.getDate() + 7);
  currentStartDate = startOfWeek;
  updateDateRangeDisplay();
  renderTimeline();
};

// Naviger til denne uge
const goToToday = () => {
  currentStartDate = new Date();
  updateDateRangeDisplay();
  renderTimeline();
};

// Hent alle maskiner fra API
const loadMachines = async () => {
  try {
    const response = await fetch(`${API_URL}/machines`);
    const result = await response.json();

    // Håndter forskellige response formater
    if (result.success && Array.isArray(result.data)) {
      machines = result.data;
    } else if (Array.isArray(result)) {
      machines = result;
    } else {
      console.error("Uventet dataformat fra maskine API:", result);
      machines = [];
    }

    return machines;
  } catch (error) {
    console.error("Fejl ved hentning af maskiner:", error);
    return [];
  }
};

// Hent alle projekter fra API
const loadProjects = async () => {
  try {
    const response = await fetch(`${API_URL}/projects`);
    const data = await response.json();
    projects = data.data || data;
    return projects;
  } catch (error) {
    console.error("Fejl ved hentning af projekter:", error);
    return [];
  }
};

// Hent alle medarbejdere fra API
const loadEmployees = async () => {
  try {
    const response = await fetch(`${API_URL}/employees`);
    const data = await response.json();
    employees = data.data || data;
    return employees;
  } catch (error) {
    console.error("Fejl ved hentning af medarbejdere:", error);
    return [];
  }
};

// Hent alle bookinger fra API
const loadBookings = async () => {
  try {
    const response = await fetch(`${API_URL}/bookings`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Fejl ved hentning af bookinger");
    }

    const data = result.data;

    // Tjek om der er bookinger med slettede maskiner eller projekter
    const invalidMachineBookings = data.filter(
      (booking) => !booking.machineID || !booking.machineID._id
    );

    const invalidProjectBookings = data.filter(
      (booking) =>
        booking.machineID &&
        booking.machineID._id && // Kun gyldig maskine
        booking.maintenanceType !== "general" && // Ikke vedligeholdelse
        (!booking.projectID || !booking.projectID._id) // Manglende projektID
    );

    const invalidBookings = [
      ...invalidMachineBookings,
      ...invalidProjectBookings,
    ];

    if (invalidBookings.length > 0) {
      console.warn(
        `Der blev fundet ${invalidBookings.length} booking(er) med slettede maskiner eller projekter.`
      );
      console.warn("Disse bookinger kan ikke vises korrekt i tidslinjen.");
      console.warn("Du bør slette disse bookinger for at undgå fejl.");

      // Vis en fejlmeddelelse øverst på siden
      const alertDiv = document.createElement("div");
      alertDiv.className = "alert alert-warning";
      alertDiv.style.padding = "10px";
      alertDiv.style.margin = "10px 0";
      alertDiv.style.backgroundColor = "#fff3cd";
      alertDiv.style.color = "#856404";
      alertDiv.style.borderRadius = "4px";
      alertDiv.style.border = "1px solid #ffeeba";

      // Specificér typen af ugyldige bookinger
      const machineMessage =
        invalidMachineBookings.length > 0
          ? `${invalidMachineBookings.length} med slettede maskiner`
          : "";
      const projectMessage =
        invalidProjectBookings.length > 0
          ? `${invalidProjectBookings.length} med slettede projekter`
          : "";
      const detailMessage = [machineMessage, projectMessage]
        .filter(Boolean)
        .join(" og ");

      alertDiv.innerHTML = `
        <strong>Advarsel:</strong> Der blev fundet ${invalidBookings.length} booking(er) (${detailMessage}).
        <br>Disse bookinger vises ikke i tidslinjen. Du bør slette dem for at undgå fejl.
        <br><button id="cleanupButton" style="margin-top: 8px; padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Ryd op (slet ugyldige bookinger)</button>
      `;

      // Indsæt advarslen øverst i tidslinjen
      const existingAlert = document.querySelector(".alert-warning");
      if (!existingAlert) {
        bookingTimeline.parentNode.insertBefore(alertDiv, bookingTimeline);

        // Tilføj event listener til oprydningsknappen
        document
          .getElementById("cleanupButton")
          .addEventListener("click", async () => {
            if (
              confirm(
                "Er du sikker på, at du vil slette alle bookinger med slettede maskiner eller projekter? Denne handling kan ikke fortrydes."
              )
            ) {
              try {
                let deletedCount = 0;

                for (const booking of invalidBookings) {
                  try {
                    await deleteBooking(booking.bookingID);
                    deletedCount++;
                  } catch (err) {
                    console.error(
                      `Kunne ikke slette booking ${booking.bookingID}:`,
                      err
                    );
                  }
                }

                alert(`${deletedCount} ugyldige bookinger blev slettet.`);
                refreshData(); // Genindlæs data
              } catch (error) {
                alert(`Der opstod en fejl: ${error.message}`);
              }
            }
          });
      }
    }

    bookings = data;
    return data;
  } catch (error) {
    console.error("Fejl ved hentning af bookinger:", error);
    return [];
  }
};

// Opret booking
const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Fejl ved oprettelse af booking");
    }

    return result.data;
  } catch (error) {
    console.error("Fejl ved oprettelse af booking:", error);
    throw error;
  }
};

// Opdater booking
const updateBooking = async (id, bookingData) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Fejl ved opdatering af booking");
    }

    return result.data;
  } catch (error) {
    console.error("Fejl ved opdatering af booking:", error);
    throw error;
  }
};

// Slet booking
const deleteBooking = async (id) => {
  try {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Fejl ved sletning af booking");
    }

    return true;
  } catch (error) {
    console.error("Fejl ved sletning af booking:", error);
    throw error;
  }
};

// Luk modal
const closeBookingModal = () => {
  const bookingModalElement = document.getElementById("bookingModal");
  const bookingForm = document.getElementById("bookingForm");
  const bookingAlert = document.getElementById("bookingAlert");
  const createBookingBtn = document.getElementById("createBookingBtn");

  const bookingModal = bootstrap.Modal.getInstance(bookingModalElement);
  if (bookingModal) {
    bookingModal.hide();
  }

  bookingForm.reset();
  bookingAlert.style.display = "none";
  selectedEmployees = [];
  document.getElementById("selectedEmployees").innerHTML = "";
  isEditing = false;
  editingBookingId = null;

  // Move focus to the "Create Booking" button
  if (createBookingBtn) {
    createBookingBtn.focus();
  }
};

// Åbn modal for oprettelse af booking
const openCreateBookingModal = () => {
  const modalTitle = document.getElementById("modalTitle");
  const deleteBtn = document.getElementById("deleteBtn");
  const bookingModalElement = document.getElementById("bookingModal");
  const bookingModal = new bootstrap.Modal(bookingModalElement, {
    backdrop: 'static', // Prevent accidental closing by clicking outside
    keyboard: false,   // Disable closing with the Escape key
  });

  modalTitle.textContent = "Opret Ny Booking";
  isEditing = false;
  editingBookingId = null;
  deleteBtn.classList.add("d-none"); // Hide delete button by adding d-none class

  document.getElementById("bookingID").value = `B${Math.floor(
    Math.random() * 10000
  )
    .toString()
    .padStart(4, "0")}`;

  const now = new Date();
  const oneHourLater = new Date(now);
  oneHourLater.setHours(oneHourLater.getHours() + 1);

  document.getElementById("startTime").value = formatDateTimeForInput(now);
  document.getElementById("endTime").value =
    formatDateTimeForInput(oneHourLater);

  bookingModal.show();
};

// Åbn modal for redigering af booking
const openEditBookingModal = (booking) => {
  const modalTitle = document.getElementById("modalTitle");
  const deleteBtn = document.getElementById("deleteBtn");
  const bookingModalElement = document.getElementById("bookingModal");
  const bookingModal = new bootstrap.Modal(bookingModalElement, {
    backdrop: 'static', // Prevent accidental closing by clicking outside
    keyboard: false,   // Disable closing with the Escape key
  });

  modalTitle.textContent = "Rediger Booking";
  isEditing = true;
  editingBookingId = booking.bookingID;
  deleteBtn.classList.remove("d-none"); // Ensure the delete button is visible

  document.getElementById("bookingID").value = booking.bookingID;
  document.getElementById("machine").value = booking.machineID._id;

  if (booking.maintenanceType === "general") {
    document.getElementById("project").value = "maintenance";
  } else {
    document.getElementById("project").value = booking.projectID._id;
  }

  document.getElementById("notes").value = booking.notes || "";

  document.getElementById("startTime").value = formatDateTimeForInput(
    new Date(booking.startTime)
  );
  document.getElementById("endTime").value = formatDateTimeForInput(
    new Date(booking.endTime)
  );

  selectedEmployees = [];
  if (booking.employeeIDs && booking.employeeIDs.length > 0) {
    booking.employeeIDs.forEach((employee) => {
      selectedEmployees.push({
        id: employee._id,
        name: employee.name,
      });
    });
    renderSelectedEmployees();
  }

  bookingModal.show();
};

// Formater dato til input
const formatDateTimeForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Vis valgte medarbejdere
const renderSelectedEmployees = () => {
  const container = document.getElementById("selectedEmployees");
  container.innerHTML = "";

  if (selectedEmployees.length === 0) {
    container.innerHTML = "<p>Ingen medarbejdere valgt</p>";
    return;
  }

  selectedEmployees.forEach((employee, index) => {
    const item = document.createElement("div");
    item.classList.add("selected-item");
    item.innerHTML = `
      ${employee.name}
      <span class="remove-item" data-index="${index}">×</span>
    `;
    container.appendChild(item);
  });

  // Tilføj event listeners til fjern-knapper
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index);
      selectedEmployees = selectedEmployees.filter((_, i) => i !== index);
      renderSelectedEmployees();
    });
  });
};

// Fyld maskinvælger
const populateMachineSelect = () => {
  const select = document.getElementById("machine");
  select.innerHTML = '<option value="">Vælg en maskine</option>';

  machines.forEach((machine) => {
    const option = document.createElement("option");
    option.value = machine._id;
    option.textContent = machine.name;
    select.appendChild(option);
  });
};

// Fyld projektvælger
const populateProjectSelect = () => {
  const select = document.getElementById("project");
  select.innerHTML = '<option value="">Vælg et projekt</option>';

  // Tilføj vedligeholdelse som særlig mulighed
  const maintenanceOption = document.createElement("option");
  maintenanceOption.value = "maintenance";
  maintenanceOption.textContent = "Vedligeholdelse";
  select.appendChild(maintenanceOption);

  // Tilføj adskiller
  const separator = document.createElement("option");
  separator.disabled = true;
  separator.textContent = "──────────";
  select.appendChild(separator);

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project._id;
    option.textContent = `${project.name} (${project.projectID})`;
    select.appendChild(option);
  });
};

// Fyld medarbejdervælger
const populateEmployeeSelect = () => {
  const select = document.getElementById("employees");
  select.innerHTML = '<option value="">Vælg medarbejdere</option>';

  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee._id;
    option.textContent = employee.name;
    select.appendChild(option);
  });

  // Tilføj change event listener
  select.addEventListener("change", () => {
    const selectedId = select.value;
    if (!selectedId) return;

    const selectedEmployee = employees.find((e) => e._id === selectedId);
    if (
      selectedEmployee &&
      !selectedEmployees.some((e) => e.id === selectedId)
    ) {
      selectedEmployees.push({
        id: selectedId,
        name: selectedEmployee.name,
      });
      renderSelectedEmployees();
      select.value = ""; // Nulstil vælger
    }
  });
};

// Tjek om to datointervaller overlapper
const doDateRangesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

// Check booking konflikter for en maskine
const checkBookingConflicts = (
  machineId,
  startTime,
  endTime,
  excludeBookingId = null
) => {
  const conflictingBookings = bookings.filter(
    (booking) =>
      booking.machineID &&
      booking.machineID._id === machineId &&
      (booking.maintenanceType === "general" ||
        (booking.projectID && booking.projectID._id)) &&
      booking.bookingID !== excludeBookingId &&
      doDateRangesOverlap(
        new Date(startTime),
        new Date(endTime),
        new Date(booking.startTime),
        new Date(booking.endTime)
      )
  );

  return conflictingBookings.length > 0 ? conflictingBookings : false;
};

// Hjælpefunktion til at generere pastelfarver baseret på et seed (maskin-ID)
const generatePastelColor = (seed) => {
  // Generér en hash-værdi fra seed-strengen
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Konvertér til en pastelfarve (højere lysstyrke)
  const hue = Math.abs(hash % 360);
  const saturation = 70 + Math.abs((hash >> 8) % 30); // 70-100%
  const lightness = 75 + Math.abs((hash >> 16) % 15); // 75-90%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Render timelinen for den aktuelle uge
const renderTimeline = () => {
  if (!machines.length) {
    bookingTimeline.innerHTML =
      "<p>Ingen maskiner fundet. Opret maskiner før du kan oprette bookinger.</p>";
    return;
  }

  // Filtrer ugyldige bookinger (hvor machineID eller projectID ikke længere eksisterer)
  const validBookings = bookings.filter(
    (booking) =>
      booking.machineID &&
      booking.machineID._id &&
      // For bookinger med maintenanceType er projektID ikke påkrævet
      (booking.maintenanceType === "general" ||
        (booking.projectID && booking.projectID._id))
  );

  // Hvis vi opdagede ugyldige bookinger, vis en advarsel
  if (validBookings.length < bookings.length) {
    console.warn(
      "Der findes bookinger med slettede maskiner eller projekter i systemet. Disse vises ikke."
    );
  }

  // Erstat den oprindelige bookings med kun gyldige bookinger i renderingen
  const bookingsToRender = validBookings;

  const startOfWeek = getStartOfWeek(currentStartDate);
  const daysInWeek = getDaysInWeek(startOfWeek);

  let html = `
    <div class="timeline-container">
      <div class="timeline-header">
        <div class="timeline-row">
          <div class="timeline-cell machine-name">Maskine</div>
  `;

  // Tilføj datooverskrifter
  daysInWeek.forEach((day) => {
    html += `<div class="timeline-cell">${formatDate(day)}</div>`;
  });

  html += `
        </div>
      </div>
  `;

  // Tilføj rækker for hver maskine
  machines.forEach((machine) => {
    // Generér en unik pastelfarve baseret på maskinens ID
    const rowColor = generatePastelColor(machine._id);

    html += `
      <div class="timeline-row">
        <div class="timeline-cell machine-name">${machine.name}</div>
    `;

    // Tilføj celler for hver dag
    daysInWeek.forEach((day) => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      // Find bookinger for denne maskine på denne dag
      const dayBookings = bookingsToRender.filter(
        (booking) =>
          booking.machineID._id === machine._id &&
          doDateRangesOverlap(
            dayStart,
            dayEnd,
            new Date(booking.startTime),
            new Date(booking.endTime)
          )
      );

      let cellContent = "";

      if (dayBookings.length > 0) {
        // Sorter bookinger efter starttidspunkt
        dayBookings.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        );

        dayBookings.forEach((booking) => {
          let bookingClass = "booking";

          // Kontroller om det er en vedligeholdelsesreservation
          const isMaintenance = booking.maintenanceType === "general";

          if (isMaintenance) {
            bookingClass += " maintenance";
          }

          // Projekt navn
          let projectName = "Ukendt projekt";
          if (isMaintenance) {
            projectName = "Vedligeholdelse";
          } else if (booking.projectID) {
            projectName = booking.projectID.name;
          }

          // Start- og sluttidspunkter
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);

          // Hvis bookingen strækker sig over flere dage, vis kun den relevante del
          const displayStart =
            bookingStart < dayStart ? dayStart : bookingStart;
          const displayEnd = bookingEnd > dayEnd ? dayEnd : bookingEnd;

          // Bestem baggrundsfarve - brug stribet mønster for vedligeholdelse
          let bgColor = rowColor;
          let borderColor = rowColor
            .replace("hsl", "hsla")
            .replace(")", ", 0.5)");
          let style = `background-color: ${bgColor}; border-color: ${borderColor}`;

          if (isMaintenance) {
            style = `background: repeating-linear-gradient(
              45deg,
              ${bgColor},
              ${bgColor} 10px,
              ${borderColor} 10px,
              ${borderColor} 20px
            ); border-color: #888`;
          }

          cellContent += `
            <div class="${bookingClass}" data-booking-id="${booking.bookingID}" data-machine-id="${machine._id}" style="${style}">
              <div><strong>${projectName}</strong></div>
              <div>${formatTimeOnly(displayStart)} - ${formatTimeOnly(displayEnd)}</div>
              <div class="booking-tooltip">
                <p><strong>Projekt:</strong> ${projectName}</p>
                <p><strong>Start:</strong> ${formatDateTime(booking.startTime)}</p>
                <p><strong>Slut:</strong> ${formatDateTime(booking.endTime)}</p>
                ${booking.notes ? `<p><strong>Noter:</strong> ${booking.notes}</p>` : ""}
                <p><strong>Medarbejdere:</strong> ${
                  booking.employeeIDs && booking.employeeIDs.length > 0
                    ? booking.employeeIDs.map((e) => e.name).join(", ")
                    : "Ingen"
                }</p>
              </div>
            </div>
          `;
        });
      }

      html += `<div class="timeline-cell">${cellContent}</div>`;
    });

    html += `</div>`;
  });

  html += `</div>`;

  bookingTimeline.innerHTML = html;

  // Tilføj event listeners til booking-elementer
  document.querySelectorAll(".booking").forEach((bookingEl) => {
    bookingEl.addEventListener("click", () => {
      const bookingId = bookingEl.dataset.bookingId;
      const booking = bookings.find((b) => b.bookingID === bookingId);
      if (booking) {
        openEditBookingModal(booking);
      }
    });
  });
};

// Håndter formular indsendelse
const handleFormSubmit = async (e) => {
  e.preventDefault();

  // Retrieve form values
  const bookingID = document.getElementById("bookingID").value.trim();
  const machineID = document.getElementById("machine").value;
  const projectID = document.getElementById("project").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  // Validate required fields
  if (!bookingID || !machineID || !projectID || !startTime || !endTime) {
    showAlert("Alle felter markeret med * skal udfyldes.", "danger");
    return;
  }

  // Validate time range
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  if (startDate >= endDate) {
    showAlert("Starttidspunktet skal være før sluttidspunktet.", "danger");
    return;
  }

  // Check for booking conflicts
  const conflicts = checkBookingConflicts(
    machineID,
    startTime,
    endTime,
    isEditing ? editingBookingId : null
  );

  if (conflicts) {
    const conflictMessages = conflicts.map(
      (conflict) =>
        `${formatTimeOnly(conflict.startTime)} - ${formatTimeOnly(conflict.endTime)}`
    );
    showAlert(`Tidsrummet (${conflictMessages.join(", ")}) er allerede optaget.`, "danger");
    return;
  }

  // Proceed with booking creation or update
  const bookingData = {
    bookingID,
    machineID,
    projectID,
    startTime,
    endTime,
    employeeIDs: selectedEmployees.map((e) => e.id),
    notes: document.getElementById("notes").value.trim(),
  };

  try {
    if (isEditing) {
      await updateBooking(editingBookingId, bookingData);
      showAlert("Booking opdateret.", "success");
    } else {
      await createBooking(bookingData);
      showAlert("Booking oprettet.", "success");
    }

    closeBookingModal();
    await refreshData();
  } catch (error) {
    showAlert("Der opstod en fejl under behandling af bookingen.", "danger");
    console.error(error);
  }
};

const showAlert = (message, type = "danger") => {
  bookingAlert.textContent = message;
  bookingAlert.className = `alert alert-${type}`;
  bookingAlert.style.display = "block";
};

// Opdater alle data og genrender timeline
const refreshData = async () => {
  bookingTimeline.innerHTML = "<p class='loading'>Indlæser bookinger...</p>";

  try {
    // Hent data parallelt
    await Promise.all([
      loadMachines(),
      loadProjects(),
      loadEmployees(),
      loadBookings(),
    ]);

    renderTimeline();
  } catch (error) {
    bookingTimeline.innerHTML = `<p>Der opstod en fejl: ${error.message}</p>`;
  }
};

// Håndter sletning af booking
const handleDeleteBooking = async () => {
  try {
    if (!editingBookingId) {
      showAlert("Ingen booking at slette");
      return;
    }

    if (
      !confirm(
        "Er du sikker på, at du vil slette denne booking? Denne handling kan ikke fortrydes."
      )
    ) {
      return;
    }

    await deleteBooking(editingBookingId);

    // Opdater data og luk modal
    closeBookingModal();
    await refreshData();
    renderTimeline();

    // Vis bekræftelse
    alert("Bookingen er blevet slettet");
  } catch (error) {
    showAlert(`Fejl ved sletning af booking: ${error.message}`);
  }
};

// Initialiser applikationen
const initApp = async () => {
  // Indlæs data
  await refreshData();

  // Opdater dato display
  updateDateRangeDisplay();

  // Udfyld select-bokse
  populateMachineSelect();
  populateProjectSelect();
  populateEmployeeSelect();

  // DOM-elementer
  const createBookingBtn = document.getElementById("createBookingBtn");
  const closeModal = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const bookingForm = document.getElementById("bookingForm");
  const deleteBtn = document.getElementById("deleteBtn");
  const prevWeekBtn = document.getElementById("prevWeek");
  const nextWeekBtn = document.getElementById("nextWeek");
  const todayBtn = document.getElementById("todayButton");
  const bookingModal = document.getElementById("bookingModal");

  // Check for missing elements
  const elements = {
    createBookingBtn,
    closeModal,
    cancelBtn,
    bookingForm,
    deleteBtn,
    prevWeekBtn,
    nextWeekBtn,
    todayBtn,
    bookingModal,
  };

  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`Missing DOM element: ${key}`);
    }
  }

  // Add event listeners if elements exist
  if (createBookingBtn) {
    console.log("Attaching event listener to 'Opret Ny Booking' button.");
    createBookingBtn.addEventListener("click", () => {
      console.log("'Opret Ny Booking' button clicked.");
      openCreateBookingModal();
    });
  } else {
    console.error("'Opret Ny Booking' button not found in the DOM.");
  }
  if (closeModal) closeModal.addEventListener("click", closeBookingModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeBookingModal);
  if (bookingForm) {
    bookingForm.addEventListener("submit", handleFormSubmit);
  }
  if (deleteBtn) deleteBtn.addEventListener("click", handleDeleteBooking);

  if (prevWeekBtn) prevWeekBtn.addEventListener("click", goToPrevWeek);
  if (nextWeekBtn) nextWeekBtn.addEventListener("click", goToNextWeek);
  if (todayBtn) todayBtn.addEventListener("click", goToToday);

  if (bookingModal) {
    window.addEventListener("click", (event) => {
      if (event.target === bookingModal) {
        closeBookingModal();
      }
    });
  }
};

// Start applikationen når DOM er indlæst
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
