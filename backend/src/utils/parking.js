function groupSlotsByArea(slots) {
  return slots.reduce((groups, slot) => {
    if (!groups[slot.areaName]) {
      groups[slot.areaName] = [];
    }

    groups[slot.areaName].push(slot);
    return groups;
  }, {});
}

function serializeUser(user) {
  if (!user) return null;

  const vehicles = Array.isArray(user.vehicles)
    ? user.vehicles.map((vehicle) => ({
        number: vehicle.number,
        type: vehicle.type || 'Car',
        model: vehicle.model || '',
        color: vehicle.color || '',
        isDefault: Boolean(vehicle.isDefault),
      }))
    : [];

  const activeVehicleNo = user.defaultVehicleNo || user.vehicleNo || vehicles.find((vehicle) => vehicle.isDefault)?.number || null;

  return {
    id: user._id,
    name: user.name || user.username,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    employeeId: user.employeeId,
    role: user.role,
    vehicleNo: activeVehicleNo,
    defaultVehicleNo: activeVehicleNo,
    vehicles,
    department: user.department || '',
    branchName: user.branchName || 'Main Branch',
    branchCode: user.branchCode || 'MAIN',
    isLoggedIn: Boolean(user.isLoggedIn),
    assignedSlot: user.assignedSlot || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function normalizeVehicleNumber(value = '') {
  return value.trim().toUpperCase();
}

function getVehicleNumbers(user) {
  const vehicles = Array.isArray(user?.vehicles) ? user.vehicles : [];
  const numbers = [user?.defaultVehicleNo, user?.vehicleNo, ...vehicles.map((vehicle) => vehicle.number)]
    .filter(Boolean)
    .map(normalizeVehicleNumber);

  return [...new Set(numbers)];
}

function timeToMinutes(time) {
  if (!time || typeof time !== 'string') return null;
  const parts = time.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

function isTimeBetween(targetTime, startTime, endTime) {
  const t = timeToMinutes(targetTime);
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  if (t === null || s === null || e === null) return false;
  // allow equality at boundaries
  return t >= s && t <= e;
}

function dayNameFromDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[d.getDay()];
}

function isSameBooking(dateA, timeA, dateB, timeB) {
  if (!dateA || !dateB) return false;
  return String(dateA) === String(dateB) && String(timeA || '') === String(timeB || '');
}

module.exports = {
  groupSlotsByArea,
  serializeUser,
  normalizeVehicleNumber,
  getVehicleNumbers,
  timeToMinutes,
  isTimeBetween,
  dayNameFromDate,
  isSameBooking,
};