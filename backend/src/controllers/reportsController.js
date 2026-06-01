const EntryExit = require('../models/EntryExit');

function escapeCSV(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function createReportsController() {
  async function exportEntriesCSV(startStr, endStr) {
    const start = startStr ? new Date(startStr) : new Date(0);
    const end = endStr ? new Date(endStr) : new Date();
    // include entire end day if time not provided
    if (endStr && endStr.length === 10) {
      end.setHours(23, 59, 59, 999);
    }

    const rows = await EntryExit.find({
      createdAt: { $gte: start, $lte: end },
    }).sort({ checkInTime: 1 }).lean();

    const headers = ['id', 'vehicleNumber', 'userId', 'slotId', 'checkInTime', 'checkOutTime', 'durationMinutes', 'notes', 'createdAt'];

    const lines = [headers.join(',')];
    rows.forEach((r) => {
      const values = headers.map((h) => {
        if (h === 'id') return escapeCSV(r._id);
        if (h === 'checkInTime' || h === 'checkOutTime' || h === 'createdAt') return escapeCSV(r[h] ? new Date(r[h]).toISOString() : '');
        return escapeCSV(r[h]);
      });
      lines.push(values.join(','));
    });

    return lines.join('\n');
  }

  return { exportEntriesCSV };
}

module.exports = { createReportsController };
