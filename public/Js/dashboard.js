function toggleArea(areaIdx) {
  const wrapper = document.getElementById('area-table-' + areaIdx);
  const caret = document.getElementById('caret-' + areaIdx);
  wrapper.style.display = wrapper.style.display === 'block' ? 'none' : 'block';
  caret.classList.toggle('down');
}

async function releaseSlot(event, form) {
  event.preventDefault();

  const vehicleNo = form.querySelector('input[name="vehicleNo"]').value;

  const response = await fetch('/release-slot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleNo })
  });

  const result = await response.json();
  if (!response.ok) return alert(result.message || 'Failed to release slot');

  alert(result.message);

  const slotDiv = form.closest('.parking-slot');
  const area = slotDiv.getAttribute('data-area');
  const slotNumber = slotDiv.getAttribute('data-slot');
  const areaIndex = slotDiv.getAttribute('data-area-index');

  // Update class
  slotDiv.className = 'parking-slot slot-available';

  // Replace slot HTML with new Assign form
  const newFormHTML = `
    <div class="slot-number">Slot ${slotNumber}</div>
    <div class="slot-status available">Available</div>
    <form class="action-form" method="POST" action="/assign">
      <input type="hidden" name="area" value="${area}">
      <input type="hidden" name="slotNumber" value="${slotNumber}">
      <input type="text" name="employeeId" placeholder="Enter Emp ID" required>
      <button class="btn">Assign</button>
    </form>
  `;
  slotDiv.innerHTML = newFormHTML;

  // Update status section
  const occupiedEl = document.getElementById(`occupied-${areaIndex}`);
  const availableEl = document.getElementById(`available-${areaIndex}`);
  const percentEl = document.getElementById(`occupancy-percent-${areaIndex}`);
  const barEl = document.getElementById(`occupancy-bar-${areaIndex}`);

  let occupied = parseInt(occupiedEl.innerText, 10);
  let available = parseInt(availableEl.innerText, 10);

  occupied--;
  available++;

  const percent = Math.round((occupied / (occupied + available)) * 100);

  occupiedEl.innerText = occupied;
  availableEl.innerText = available;
  percentEl.innerText = percent + '%';
  barEl.style.width = percent + '%';
}
async function assignSlot(event, form) {
  event.preventDefault();

  const area = form.querySelector('input[name="area"]').value;
  const slotNumber = form.querySelector('input[name="slotNumber"]').value;
  const employeeId = form.querySelector('input[name="employeeId"]').value.trim();
  const areaIndex = form.closest('.parking-slot').getAttribute('data-area-index');

  const response = await fetch('/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ area, slotNumber, employeeId })
  });

  const result = await response.json();

  if (!response.ok) return alert(result.message || 'Failed to assign slot');

  alert(result.message);

  const slotDiv = form.closest('.parking-slot');
  slotDiv.className = 'parking-slot slot-occupied';

  // Replace with occupied slot UI
  slotDiv.innerHTML = `
    <div class="slot-number">Slot ${slotNumber}</div>
    <div class="slot-status occupied">Occupied</div>
    <div class="emp-id">Emp ID: ${employeeId}</div>
    <form class="action-form" onsubmit="releaseSlot(event, this)">
      <input type="hidden" name="vehicleNo" value="${result.vehicleNo || 'N/A'}">
      <button class="btn">Release</button>
    </form>
  `;

  // Update dashboard stats
  const occupiedEl = document.getElementById(`occupied-${areaIndex}`);
  const availableEl = document.getElementById(`available-${areaIndex}`);
  const percentEl = document.getElementById(`occupancy-percent-${areaIndex}`);
  const barEl = document.getElementById(`occupancy-bar-${areaIndex}`);

  let occupied = parseInt(occupiedEl.innerText, 10);
  let available = parseInt(availableEl.innerText, 10);

  occupied++;
  available--;

  const percent = Math.round((occupied / (occupied + available)) * 100);

  occupiedEl.innerText = occupied;
  availableEl.innerText = available;
  percentEl.innerText = percent + '%';
  barEl.style.width = percent + '%';
}
