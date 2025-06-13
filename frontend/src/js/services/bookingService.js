// Booking Service
// This script handles booking functionality and API calls to the backend

// DOM elements
const bookingTimeline = document.getElementById("bookingTimeline");
const currentDateRangeSpan = document.getElementById("currentDateRange");
const bookingAlert = document.getElementById("bookingAlert");

// State management
let machines = [];
let projects = [];
let employees = [];
let bookings = [];
let selectedEmployees = [];
let currentStartDate = new Date();
let isEditing = false;
let editingBookingId = null;
let isOrderEditing = false;
let machineOrder = {};

// Format dates for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
  });
};

// Format date and time for display
const formatDateTime = (date) => {
  return new Date(date).toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format time only for display
const formatTimeOnly = (date) => {
  return new Date(date).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format employees for booking display
const formatEmployeesForBooking = (employeeIDs) => {
  if (!employeeIDs || employeeIDs.length === 0) {
    return "Ingen medarbejdere";
  }

  // Format names as "Fornavn + Efternavn Initial"
  const formattedNames = employeeIDs.map((employee) => {
    const nameParts = employee.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}`;
    }
    return nameParts[0]; // Just first name if no last name
  });
  return formattedNames.join(", ");
  // Handle different cases based on number of employees
  /*if (formattedNames.length <= 4) {
    return formattedNames.join(", ");
  } else {
    // Show first 2 + count of others
    const visibleNames = formattedNames.slice(0, 2);
    const remainingCount = formattedNames.length - 2;
    return `${visibleNames.join(", ")} +${remainingCount} andre`;
  }*/
};

// Get the start of the week (Sunday or Monday)
const getStartOfWeek = (date) => {
  const newDate = new Date(date);
  const day = newDate.getDay(); // 0 for Sunday, 1 for Monday, ...
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday (add -6 if it's Sunday)
  newDate.setDate(diff);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

// Get 7 days from start date
const getDaysInWeek = (startDate) => {
  const days = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

// Update date range display
const updateDateRangeDisplay = () => {
  const startOfWeek = getStartOfWeek(currentStartDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  currentDateRangeSpan.textContent = `${formatDate(startOfWeek)} - ${formatDate(
    endOfWeek
  )}`;
};

// Navigate to previous week
const goToPrevWeek = () => {
  const startOfWeek = getStartOfWeek(currentStartDate);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  currentStartDate = startOfWeek;
  updateDateRangeDisplay();
  renderTimeline();
};

// Navigate to next week
const goToNextWeek = () => {
  const startOfWeek = getStartOfWeek(currentStartDate);
  startOfWeek.setDate(startOfWeek.getDate() + 7);
  currentStartDate = startOfWeek;
  updateDateRangeDisplay();
  renderTimeline();
};

// Navigate to current week
const goToToday = () => {
  currentStartDate = new Date();
  updateDateRangeDisplay();
  renderTimeline();
};

// Load all machines from API
const loadMachines = async () => {
  try {
    const response = await fetch(`/api/machines`);
    const result = await response.json();

    // Handle different response formats
    if (result.success && Array.isArray(result.data)) {
      machines = result.data;
    } else if (Array.isArray(result)) {
      machines = result;
    } else {
      console.error("Unexpected data format from machine API:", result);
      machines = [];
    }

    return machines;
  } catch (error) {
    console.error("Error loading machines:", error);
    return [];
  }
};

// Load all projects from API
const loadProjects = async () => {
  try {
    const response = await fetch(`/api/projects`);
    const data = await response.json();
    projects = data.data || data;
    return projects;
  } catch (error) {
    console.error("Error loading projects:", error);
    return [];
  }
};

// Load all employees from API
const loadEmployees = async () => {
  try {
    const response = await fetch(`/api/employees`);
    const data = await response.json();
    employees = data.data || data;
    return employees;
  } catch (error) {
    console.error("Error loading employees:", error);
    return [];
  }
};

// Find invalid bookings
const findInvalidBookings = (bookings) => {
  const invalidMachineBookings = bookings.filter(
    (booking) => !booking.machineID || !booking.machineID._id
  );

  const invalidProjectBookings = bookings.filter(
    (booking) =>
      booking.machineID &&
      booking.machineID._id && // Only valid machine
      booking.maintenanceType !== "general" && // Not maintenance
      (!booking.projectID || !booking.projectID._id) // Missing projectID
  );

  return {
    invalidMachineBookings,
    invalidProjectBookings,
    allInvalid: [...invalidMachineBookings, ...invalidProjectBookings],
  };
};

// Show warning for invalid bookings
const showInvalidBookingsWarning = (
  invalidBookings,
  invalidMachineBookings,
  invalidProjectBookings
) => {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-warning";
  alertDiv.style.padding = "10px";
  alertDiv.style.margin = "10px 0";
  alertDiv.style.backgroundColor = "#fff3cd";
  alertDiv.style.color = "#856404";
  alertDiv.style.borderRadius = "4px";
  alertDiv.style.border = "1px solid #ffeeba";

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

  const existingAlert = document.querySelector(".alert-warning");
  if (!existingAlert) {
    bookingTimeline.parentNode.insertBefore(alertDiv, bookingTimeline);
    setupCleanupButton(invalidBookings);
  }
};

// Setup cleanup button
const setupCleanupButton = (invalidBookings) => {
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
                `Could not delete booking ${booking.bookingID}:`,
                err
              );
            }
          }
          alert(`${deletedCount} ugyldige bookinger blev slettet.`);
          refreshData();
        } catch (error) {
          alert(`Der opstod en fejl: ${error.message}`);
        }
      }
    });
};

// Main function to load bookings
const loadBookings = async () => {
  try {
    const response = await fetch(`/api/bookings`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error loading bookings");
    }

    const data = result.data;
    const { invalidMachineBookings, invalidProjectBookings, allInvalid } =
      findInvalidBookings(data);

    if (allInvalid.length > 0) {
      console.warn(
        `Found ${allInvalid.length} booking(s) with deleted machines or projects.`
      );
      console.warn(
        "These bookings cannot be displayed correctly in the timeline."
      );
      console.warn("You should delete these bookings to avoid errors.");

      showInvalidBookingsWarning(
        allInvalid,
        invalidMachineBookings,
        invalidProjectBookings
      );
    }

    bookings = data;
    return data;
  } catch (error) {
    console.error("Error loading bookings:", error);
    return [];
  }
};

// Create booking
const createBooking = async (bookingData) => {
  try {
    // Convert dates to UTC
    const bookingDataUTC = {
      ...bookingData,
      startTime: new Date(bookingData.startTime).toISOString(),
      endTime: new Date(bookingData.endTime).toISOString(),
    };

    const response = await fetch(`/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingDataUTC),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error creating booking");
    }

    return result.data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Update booking
const updateBooking = async (id, bookingData) => {
  try {
    // Convert dates to UTC
    const bookingDataUTC = {
      ...bookingData,
      startTime: new Date(bookingData.startTime).toISOString(),
      endTime: new Date(bookingData.endTime).toISOString(),
    };

    const response = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingDataUTC),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error updating booking");
    }

    return result.data;
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

// Delete booking
const deleteBooking = async (id) => {
  try {
    const response = await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error deleting booking");
    }

    return true;
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

// Close modal
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

// Open modal for creating booking
const openCreateBookingModal = () => {
  const modalTitle = document.getElementById("modalTitle");
  const deleteBtn = document.getElementById("deleteBtn");
  const bookingModalElement = document.getElementById("bookingModal");
  const bookingModal = new bootstrap.Modal(bookingModalElement, {
    backdrop: "static", // Prevent accidental closing by clicking outside
    keyboard: false, // Disable closing with the Escape key
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

  // Reset selected employees and update dropdown
  selectedEmployees = [];
  renderSelectedEmployees();
  populateEmployeeSelect();

  bookingModal.show();
};

// Open modal for editing booking
const openEditBookingModal = (booking) => {
  const modalTitle = document.getElementById("modalTitle");
  const deleteBtn = document.getElementById("deleteBtn");
  const bookingModalElement = document.getElementById("bookingModal");
  const bookingModal = new bootstrap.Modal(bookingModalElement, {
    backdrop: "static", // Prevent accidental closing by clicking outside
    keyboard: false, // Disable closing with the Escape key
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
    populateEmployeeSelect(); // Update employee dropdown to remove selected employees
  }

  bookingModal.show();
};

// Format date for input fields
const formatDateTimeForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Display selected employees
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

  // Add event listeners to remove buttons
  document.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index);
      selectedEmployees = selectedEmployees.filter((_, i) => i !== index);
      renderSelectedEmployees();
      populateEmployeeSelect(); // Re-populate to add back removed employee
    });
  });
};

// Populate machine selector
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

// Populate project selector
const populateProjectSelect = () => {
  const select = document.getElementById("project");
  select.innerHTML = '<option value="">Vælg et projekt</option>';

  // Add maintenance as special option
  const maintenanceOption = document.createElement("option");
  maintenanceOption.value = "maintenance";
  maintenanceOption.textContent = "Vedligeholdelse";
  select.appendChild(maintenanceOption);

  // Add separator
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

// Populate employee selector
const populateEmployeeSelect = () => {
  const select = document.getElementById("employees");
  select.innerHTML = '<option value="">Vælg medarbejdere</option>';

  // Filter out already selected employees
  const availableEmployees = employees.filter(
    (employee) =>
      !selectedEmployees.some((selected) => selected.id === employee._id)
  );

  availableEmployees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee._id;
    option.textContent = employee.name;
    select.appendChild(option);
  });

  // Add change event listener (only add once)
  select.removeEventListener("change", handleEmployeeSelection);
  select.addEventListener("change", handleEmployeeSelection);
};

// Handle employee selection - separated for easier management
const handleEmployeeSelection = () => {
  const select = document.getElementById("employees");
  const selectedId = select.value;
  if (!selectedId) return;

  const selectedEmployee = employees.find((e) => e._id === selectedId);
  if (!selectedEmployee) {
    select.value = ""; // Reset selector
    return;
  }

  // Add employee (no need to check for duplicates since they're filtered out)
  selectedEmployees.push({
    id: selectedId,
    name: selectedEmployee.name,
  });

  renderSelectedEmployees();
  populateEmployeeSelect(); // Re-populate to remove newly selected employee
  select.value = ""; // Reset selector
};

// Check if two date ranges overlap
const doDateRangesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

// Check booking conflicts for a machine
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

// Helper function to generate pastel colors based on a seed (machine ID)
const generatePastelColor = (seed) => {
  // Generate a hash value from the seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to a pastel color (higher lightness)
  const hue = Math.abs(hash % 360);
  const saturation = 70 + Math.abs((hash >> 8) % 30); // 70-100%
  const lightness = 75 + Math.abs((hash >> 16) % 15); // 75-90%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Render timeline for current week
const renderTimeline = () => {
  if (!machines.length) {
    bookingTimeline.innerHTML =
      "<p>Ingen maskiner fundet. Opret maskiner før du kan oprette bookinger.</p>";
    return;
  }

  // Filter invalid bookings (where machineID or projectID no longer exists)
  const validBookings = bookings.filter(
    (booking) =>
      booking.machineID &&
      booking.machineID._id &&
      // For bookings with maintenanceType, projectID is not required
      (booking.maintenanceType === "general" ||
        (booking.projectID && booking.projectID._id))
  );

  // If we detected invalid bookings, show a warning
  if (validBookings.length < bookings.length) {
    console.warn(
      "There are bookings with deleted machines or projects in the system. These are not displayed."
    );
  }

  // Replace original bookings with only valid bookings in rendering
  const bookingsToRender = validBookings;

  const startOfWeek = getStartOfWeek(currentStartDate);
  const daysInWeek = getDaysInWeek(startOfWeek);

  let html = `
    <div class="timeline-container">
      <div class="timeline-header">
        <div class="timeline-row">
          <div class="timeline-cell machine-name">Maskine</div>
  `;

  // Add date headers
  daysInWeek.forEach((day) => {
    html += `<div class="timeline-cell">${formatDate(day)}</div>`;
  });

  html += `
        </div>
      </div>
  `;

  // Add rows for each machine
  machines.forEach((machine) => {
    // Generate a unique pastel color based on machine ID
    const rowColor = generatePastelColor(machine._id);

    html += `
      <div class="timeline-row" data-machine-id="${machine._id}">
        <div class="timeline-cell machine-name">${machine.name}</div>
    `;

    // Add cells for each day
    daysInWeek.forEach((day) => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      // Find bookings for this machine on this day
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
        // Sort bookings by start time
        dayBookings.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        );

        dayBookings.forEach((booking) => {
          let bookingClass = "booking";

          // Check if it's a maintenance reservation
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

          // Start and end times
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);

          // If booking spans multiple days, show only the relevant part
          const displayStart =
            bookingStart < dayStart ? dayStart : bookingStart;
          const displayEnd = bookingEnd > dayEnd ? dayEnd : bookingEnd;

          // Determine background color - use striped pattern for maintenance
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
            <div class="${bookingClass}" data-booking-id="${
            booking.bookingID
          }" data-machine-id="${machine._id}" style="${style}">
              <div><strong>${projectName}</strong></div>
              <div class="text-muted small">${formatEmployeesForBooking(
                booking.employeeIDs
              )}</div>
              <div class="booking-tooltip">
                <p><strong>Projekt:</strong> ${projectName}</p>
                <p><strong>Start:</strong> ${formatDateTime(
                  booking.startTime
                )}</p>
                <p><strong>Slut:</strong> ${formatDateTime(booking.endTime)}</p>
                ${
                  booking.notes
                    ? `<p><strong>Noter:</strong> ${booking.notes}</p>`
                    : ""
                }
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

  // Add event listeners to booking elements
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

// Handle form submission
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
        `${formatTimeOnly(conflict.startTime)} - ${formatTimeOnly(
          conflict.endTime
        )}`
    );
    showAlert(
      `Tidsrummet (${conflictMessages.join(", ")}) er allerede optaget.`,
      "danger"
    );
    return;
  }

  // Prepare booking data
  const bookingData = {
    bookingID,
    machineID,
    startTime,
    endTime,
    employeeIDs: selectedEmployees.map((e) => e.id),
    notes: document.getElementById("notes").value.trim(),
  };

  // Handle maintenance bookings differently
  if (projectID === "maintenance") {
    bookingData.maintenanceType = "general";
    bookingData.projectID = null; // Set projectID to null for maintenance bookings
  } else {
    bookingData.projectID = projectID;
    // Explicitly delete maintenanceType for project bookings
    delete bookingData.maintenanceType;
  }

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

// Update all data and re-render timeline
const refreshData = async () => {
  bookingTimeline.innerHTML = "<p class='loading'>Indlæser bookinger...</p>";

  try {
    // Load data in parallel
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

// Handle booking deletion
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

    // Update data and close modal
    closeBookingModal();
    await refreshData();
    renderTimeline();

    // Vis bekræftelse
    alert("Bookingen er blevet slettet");
  } catch (error) {
    showAlert(`Fejl ved sletning af booking: ${error.message}`);
  }
};

// Add event listeners for order editing
const setupOrderEditing = () => {
  const editOrderBtn = document.getElementById("editOrderBtn");
  const saveOrderBtn = document.getElementById("saveOrderBtn");

  editOrderBtn.addEventListener("click", () => {
    isOrderEditing = !isOrderEditing;
    editOrderBtn.classList.toggle("active");
    saveOrderBtn.classList.toggle("visible");

    const rows = document.querySelectorAll(".timeline-row");
    rows.forEach((row) => {
      if (isOrderEditing) {
        row.classList.add("editing");
        row.setAttribute("draggable", "true");
        row.addEventListener("dragstart", handleDragStart);
        row.addEventListener("dragover", handleDragOver);
        row.addEventListener("drop", handleDrop);
        row.addEventListener("dragend", handleDragEnd);
      } else {
        row.classList.remove("editing");
        row.setAttribute("draggable", "false");
        row.removeEventListener("dragstart", handleDragStart);
        row.removeEventListener("dragover", handleDragOver);
        row.removeEventListener("drop", handleDrop);
        row.removeEventListener("dragend", handleDragEnd);
      }
    });
  });

  saveOrderBtn.addEventListener("click", saveMachineOrder);
};

// Drag and drop handling functions
const handleDragStart = (e) => {
  e.target.classList.add("dragging");
  e.dataTransfer.setData("text/plain", e.target.dataset.machineId);
};

const handleDragOver = (e) => {
  e.preventDefault();
  const draggingRow = document.querySelector(".dragging");
  const rows = [...document.querySelectorAll(".timeline-row:not(.dragging)")];

  const closestRow = rows.reduce(
    (closest, row) => {
      const box = row.getBoundingClientRect();
      const offset = e.clientY - (box.top + box.height / 2);

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: row };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;

  if (closestRow) {
    closestRow.parentNode.insertBefore(draggingRow, closestRow);
  } else {
    // If no row is found (we're below the last row)
    // Insert the dragged row after the last row
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      lastRow.parentNode.insertBefore(draggingRow, lastRow.nextSibling);
    }
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  const draggedId = e.dataTransfer.getData("text/plain");
  const rows = document.querySelectorAll(".timeline-row");

  // Update machineOrder object
  rows.forEach((row, index) => {
    machineOrder[row.dataset.machineId] = index;
  });
};

const handleDragEnd = (e) => {
  e.target.classList.remove("dragging");
};

// Save machine order
const saveMachineOrder = async () => {
  try {
    const rows = document.querySelectorAll(".timeline-row");
    const machineOrders = [];

    rows.forEach((row, index) => {
      const machineId = row.dataset.machineId;
      if (machineId) {
        machineOrders.push({
          machineId,
          order: index,
        });
      }
    });

    console.log("Sending order update:", machineOrders);

    const response = await fetch(`/api/machines/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineOrders }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Error saving order");
    }

    if (result.success) {
      showAlert("Order saved", "success");

      // Disable editing mode
      isOrderEditing = false;
      const editOrderBtn = document.getElementById("editOrderBtn");
      const saveOrderBtn = document.getElementById("saveOrderBtn");

      editOrderBtn.classList.remove("active");
      saveOrderBtn.classList.remove("visible");

      // Remove drag-and-drop functionality
      const rows = document.querySelectorAll(".timeline-row");
      rows.forEach((row) => {
        row.classList.remove("editing");
        row.setAttribute("draggable", "false");
        row.removeEventListener("dragstart", handleDragStart);
        row.removeEventListener("dragover", handleDragOver);
        row.removeEventListener("drop", handleDrop);
        row.removeEventListener("dragend", handleDragEnd);
      });

      // Update view
      await refreshData();

      // Trigger event to update machine overview
      document.dispatchEvent(new Event("machineOrderUpdated"));
    } else {
      throw new Error(result.message || "Unknown error saving order");
    }
  } catch (error) {
    console.error("Fejl ved gem af rækkefølge:", error);
    showAlert("Fejl ved gem af rækkefølge: " + error.message, "danger");
  }
};

// Initialize application
const initApp = async () => {
  // Load data
  await refreshData();

  // Update date display
  updateDateRangeDisplay();

  // Populate select boxes
  populateMachineSelect();
  populateProjectSelect();
  populateEmployeeSelect();

  // DOM elements
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
    createBookingBtn.addEventListener("click", () => {
      console.log("'Create New Booking' button clicked.");
      openCreateBookingModal();
    });
  } else {
    console.error("'Create New Booking' button not found in the DOM.");
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

  setupOrderEditing();
};

// Start application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});
