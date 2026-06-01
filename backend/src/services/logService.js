const jwt = require('jsonwebtoken');
const SecurityLog = require('../models/SecurityLog');

function createLogService({ jwtSecret }) {
  async function logRequest(req, res, extra = {}) {
    try {
      const token = req.cookies?.token;
      let decoded = null;
      if (token) {
        try { decoded = jwt.verify(token, jwtSecret); } catch (e) { decoded = null; }
      }

      const record = new SecurityLog({
        userId: decoded?._id || decoded?.id || null,
        username: decoded?.username || decoded?.email || null,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        body: (req.method === 'GET') ? null : (req.body || null),
        meta: extra || null,
      });

      await record.save();
      return record.toObject();
    } catch (err) {
      // swallow logging errors
      console.error('logService error', err.message);
      return null;
    }
  }

  async function listLogs({ page = 1, limit = 50, from, to } = {}) {
    const query = {};
    if (from) query.createdAt = { $gte: new Date(from) };
    if (to) query.createdAt = { ...(query.createdAt || {}), $lte: new Date(to) };
    const skip = (page - 1) * limit;
    const rows = await SecurityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await SecurityLog.countDocuments(query);
    return { rows, total };
  }

  return { logRequest, listLogs };
}

module.exports = { createLogService };
