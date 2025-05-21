// bookingOverview.js
// Handles booking overview page logic

// --- API Test Function ---
/*async function testAPI() {
  try {
    console.log("Testing API call to /api/bookings");
    const response = await fetch("/api/bookings");
    const responseText = await response.text();

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    console.log("Raw response text:", responseText);

    try {
      const data = JSON.parse(responseText);
      console.log("Parsed data:", data);

      if (data.success && data.data) {
        console.log("Number of bookings:", data.data.length);
      } else if (data && Array.isArray(data)) {
        console.log("Old format - Number of bookings:", data.length);
      }
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
  }
}

window.addEventListener("load", testAPI);
*/
// --- Week Navigation Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const prevWeekButton = document.getElementById("prevWeek");
  const nextWeekButton = document.getElementById("nextWeek");
  const currentDateRange = document.getElementById("currentDateRange");

  let startDate = new Date("2025-05-12"); // Initial start date

  function updateDateRange() {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const options = { day: "numeric", month: "short" };
    currentDateRange.textContent = `${startDate.toLocaleDateString(
      "da-DK",
      options
    )} - ${endDate.toLocaleDateString("da-DK", options)}`;
  }

  prevWeekButton.addEventListener("click", () => {
    startDate.setDate(startDate.getDate() - 7);
    updateDateRange();
  });

  nextWeekButton.addEventListener("click", () => {
    startDate.setDate(startDate.getDate() + 7);
    updateDateRange();
  });

  // Initialize the date range on page load
  updateDateRange();
});

// --- Modal Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  const bookingModalElement = document.getElementById("bookingModal");
  if (bookingModalElement) {
    new bootstrap.Modal(bookingModalElement, {
      backdrop: "static",
      keyboard: false,
    });
  }
});
