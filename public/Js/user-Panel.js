// Alert system
function showAlert(message, type = 'success') {
  const alertSystem = document.getElementById('alertSystem');
  const alert = document.createElement('div');
  alert.className = 'popup-alert';
  alert.innerHTML = `
    <div class="popup-header">
      ${type === 'success' ? '✅ Success' : '❌ Error'}
    </div>
    <div class="popup-message">${message}</div>
  `;
  alertSystem.appendChild(alert);

  setTimeout(() => {
    alert.classList.add('fade-out');
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

// Fetch and show all available slots (sorted)
async function fetchAvailableSlots() {
  try {
    const response = await fetch('/available-slots');
    if (!response.ok) throw new Error('Failed to fetch slots');
    const slots = await response.json();

    const slotSelect = document.getElementById('slotSelect');
    slotSelect.innerHTML = `<option value="" disabled selected>-- Select a Slot --</option>`;

    const availableSlots = slots.filter(slot => !slot.occupied);
    availableSlots.sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));

    availableSlots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot._id;
      option.textContent = `Area: ${slot.areaName} - Slot No: ${slot.slotNumber}`;
      slotSelect.appendChild(option);
    });

    if (availableSlots.length === 0) {
      slotSelect.innerHTML = `<option disabled>No slots available</option>`;
    }
  } catch (err) {
    console.error(err);
    showAlert('Error loading slots', 'error');
  }
}

// Handle form submit for booking
document.getElementById('parkingForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const loader = document.getElementById('parkingLoader');
  const vehicleNo = this.vehicleNo.value.trim();
  const slotId = this.slotSelect.value;

  if (!vehicleNo || !slotId) {
    showAlert('Please enter vehicle number and select slot', 'error');
    return;
  }

  loader.classList.add('active');

  try {
    const response = await fetch('/book-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleNo, slotId })
    });

    const data = await response.json();
    loader.classList.remove('active');

    if (response.ok) {
      showAlert(`Slot ${data.slotNumber} booked for ${vehicleNo} in ${data.areaName}`);
      this.reset();
      fetchAvailableSlots();

      const now = new Date().toLocaleString();
      document.getElementById('reservationDetailsContainer').innerHTML = `
        <div class="reservation-card">
          <h3>✅ Parking Confirmed</h3>
          <p><strong>🕒 Parked At:</strong> ${now}</p>
          <p><strong>🚗 Vehicle Number:</strong> ${vehicleNo}</p>
          <p><strong>📍 Area:</strong> ${data.areaName}</p>
          <p><strong>🔢 Slot Number:</strong> ${data.slotNumber}</p>
        </div>
      `;
    } else {
      showAlert(data.error || 'Booking failed', 'error');
    }
  } catch (error) {
    loader.classList.remove('active');
    showAlert('Server error during booking', 'error');
  }
});

// Slot filtering by parking area (with sort)
document.getElementById('parkingAreaSelect').addEventListener('change', async function () {
  const selectedArea = this.value;
  const slotSelect = document.getElementById('slotSelect');
  slotSelect.innerHTML = '<option value="" disabled selected>-- Loading slots... --</option>';

  try {
    const response = await fetch('/available-slots');
    const slots = await response.json();
    const filteredSlots = slots.filter(slot => !slot.occupied && slot.areaName === selectedArea);
    filteredSlots.sort((a, b) => Number(a.slotNumber) - Number(b.slotNumber));

    if (filteredSlots.length === 0) {
      slotSelect.innerHTML = '<option disabled>No available slots in this area</option>';
      return;
    }

    slotSelect.innerHTML = '<option value="" disabled selected>-- Select a Slot --</option>';
    filteredSlots.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot._id;
      option.textContent = `Slot ${slot.slotNumber}`;
      slotSelect.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    slotSelect.innerHTML = '<option disabled>Error loading slots</option>';
  }
});

// Release slot logic
const releaseForm = document.getElementById('releaseForm');
if (releaseForm) {
  releaseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vehicleNo = releaseForm.vehicleNo.value.trim();

    if (!vehicleNo) {
      showAlert('Vehicle number is missing.', 'error');
      return;
    }

    try {
      const res = await fetch('/release-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNo })
      });

      const data = await res.json();

      if (res.ok) {
        showAlert(data.message, 'success');
        document.getElementById('reservationDetailsContainer').innerHTML = '';
        releaseForm.reset();
        fetchAvailableSlots();
      } else {
        showAlert(data.message || 'Release failed.', 'error');
      }
    } catch (error) {
      showAlert('Server error during release', 'error');
      console.error('Release error:', error);
    }
  });
}

// Slot status modal
const checkStatusBtn = document.getElementById("checkStatusBtn");
const modal = document.getElementById("statusModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");

checkStatusBtn.addEventListener("click", async () => {
  modal.style.display = "block";
  modalBody.innerHTML = "Loading...";

  try {
    const res = await fetch("/user-status");
    const html = await res.text();
    modalBody.innerHTML = html;
  } catch (err) {
    modalBody.innerHTML = "<p style='color:red;'>Failed to load status.</p>";
  }
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// Nav link handler
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function (e) {
    if (this.textContent.trim().includes('Logout')) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        showAlert('Logging out...');
        setTimeout(() => window.location.href = '/login', 1000);
      }
    } else {
      e.preventDefault();
      showAlert(`Navigating to ${this.textContent.trim()}`);
    }
  });
});

// Input border reset
document.querySelectorAll('.form-input').forEach(input => {
  input.addEventListener('input', function () {
    this.style.borderColor = 'rgba(102, 126, 234, 0.2)';
  });
});

// Keyboard navigation in forms
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
    const form = e.target.closest('form');
    if (form) {
      const inputs = Array.from(form.querySelectorAll('.form-input'));
      const currentIndex = inputs.indexOf(e.target);

      if (currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else {
        form.dispatchEvent(new Event('submit'));
      }
    }
  }
});

// Direct booking from card
async function bookSlot(slotId) {
  const vehicleNo = prompt("🚗 Enter your vehicle number (e.g., MH12AB1234):");
  if (!vehicleNo) {
    showAlert("❌ Booking cancelled.", 'error');
    return;
  }

  try {
    const res = await fetch("/book-slot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, vehicleNo }),
    });

    const data = await res.json();

    if (res.ok) {
      showAlert("✅ Slot booked successfully!<br><br>🪪 Vehicle No: " + vehicleNo + "<br>📍 Slot: " + data.slotNumber + "<br>🅿️ Area: " + data.areaName, 'success');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showAlert("❌ Booking failed: " + data.error, 'error');
    }
  } catch (error) {
    showAlert("🚨 Server error. Try again later.", 'error');
    console.error("Booking error:", error);
  }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  fetchAvailableSlots();

  const profileLoader = document.getElementById('profileLoader');
  profileLoader.classList.add('active');
  setTimeout(() => {
    profileLoader.classList.remove('active');
    showAlert('Welcome to ParkSmart Pro Executive Dashboard');
  }, 2000);
});
