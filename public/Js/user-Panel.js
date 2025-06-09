  // Alert system
  // alert("hiii");
  function showAlert(message, type = 'success') {
    const alertSystem = document.getElementById('alertSystem');
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 5px;">${type === 'success' ? '✅' : '⚠️'} ${type === 'success' ? 'Success' : 'Alert'}</div>
      <div>${message}</div>
    `;

    alertSystem.appendChild(alert);

    setTimeout(() => {
      alert.style.transform = 'translateX(120%)';
      setTimeout(() => {
        alertSystem.removeChild(alert);
      }, 300);
    }, 3000);
  }

  // Fetch available slots and populate select dropdown
  async function fetchAvailableSlots() {
    try {
      const response = await fetch('/available-slots');
      if (!response.ok) throw new Error('Failed to fetch slots');
      const slots = await response.json();

      const slotSelect = document.getElementById('slotSelect');
      slotSelect.innerHTML = `<option value="" disabled selected>-- Select a Slot --</option>`; // Reset options

      slots.forEach(slot => {
        if (!slot.occupied) {  // Only show available slots
          const option = document.createElement('option');
          option.value = slot._id;
          option.textContent = `Area: ${slot.areaName} - Slot No: ${slot.slotNumber}`;
          slotSelect.appendChild(option);
        }
      });

      if (slotSelect.options.length === 1) {
        // No available slots
        slotSelect.innerHTML = `<option disabled>No slots available</option>`;
      }
    } catch (err) {
      showAlert('Error loading slots', 'error');
    }
  }

  // Handle parking form submit (reserve slot)
  document.getElementById('parkingForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const loader = document.getElementById('parkingLoader');
    const vehicleNo = this.vehicleNo.value.trim();
    const slotId = this.slotSelect.value;

    if (!vehicleNo) {
      showAlert('Please enter a vehicle registration number', 'error');
      return;
    }
    if (!slotId) {
      showAlert('Please select a parking slot', 'error');
      return;
    }

    loader.classList.add('active');

    try {
      const response = await fetch('/book-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleNo, slotId }),
      });

      const data = await response.json();

      loader.classList.remove('active');

      if (response.ok) {
        showAlert(`Slot ${data.slotNumber} booked successfully for vehicle: ${vehicleNo}`);
        this.reset();

        // Remove booked slot from dropdown to prevent double booking
        const slotSelect = document.getElementById('slotSelect');
        const bookedOption = slotSelect.querySelector(`option[value="${slotId}"]`);
        fetchAvailableSlots();

        if (slotSelect.options.length === 1) {
          // No more slots available after removing
          slotSelect.innerHTML = `<option disabled>No slots available</option>`;
        }
      } else {
        showAlert(data.error || 'Booking failed', 'error');
      }
    } catch (error) {
      loader.classList.remove('active');
      showAlert('Server error during booking', 'error');
    }
  });

  // Check status button
  document.getElementById('checkStatusBtn').addEventListener('click', function () {
    const loader = document.getElementById('parkingLoader');

    loader.classList.add('active');

    setTimeout(() => {
      loader.classList.remove('active');
      showAlert('Current parking status: Available spots - 12/50');
    }, 1000);
  });

  // Profile loader demo
  document.addEventListener('DOMContentLoaded', function () {
    const profileLoader = document.getElementById('profileLoader');
    profileLoader.classList.add('active');

    setTimeout(() => {
      profileLoader.classList.remove('active');
      showAlert('Welcome to ParkSmart Pro Executive Dashboard');
    }, 2000);

    // Fetch slots on page load
    fetchAvailableSlots();
  });

  // Navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
      if (this.textContent.trim().includes('Logout')) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          showAlert('Logging out...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      } else {
        e.preventDefault();
        showAlert(`Navigating to ${this.textContent.trim()}`);
      }
    });
  });

  // Clear form validation on input
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', function () {
      this.style.borderColor = 'rgba(102, 126, 234, 0.2)';
    });
  });

  // Enhanced keyboard navigation
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

