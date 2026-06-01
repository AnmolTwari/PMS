const Notification = require('../models/Notification');

function createNotificationController() {
  async function listMine(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Not authenticated' });

      const { read, type, page = 1, limit = 50 } = req.query;
      const q = { userId };
      if (read === 'true') q.read = true;
      if (read === 'false') q.read = false;
      if (type) q.type = type;

      const pageNum = Math.max(1, Number(page) || 1);
      const perPage = Math.min(200, Math.max(5, Number(limit) || 50));

      const items = await Notification.find(q).sort({ createdAt: -1 }).skip((pageNum - 1) * perPage).limit(perPage).lean();
      const total = await Notification.countDocuments(q);
      return res.json({ notifications: items, meta: { total, page: pageNum, perPage } });
    } catch (err) {
      console.error('listMine error', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async function markRead(req, res) {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    if (!id) return res.status(400).json({ message: 'id required' });

    const n = await Notification.findOne({ _id: id, userId });
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    n.read = true;
    await n.save();
    return res.json({ ok: true, notification: n.toObject() });
  }

  return { listMine, markRead };
}

module.exports = { createNotificationController };
