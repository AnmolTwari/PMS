const jwt = require('jsonwebtoken');

function createMaintenanceMiddleware(settingsService, jwtSecret) {
  const publicPrefixes = [
    '/api/auth',
    '/api/contact',
    '/api/password',
    '/api/settings/maintenance',
    '/api/blocked/check',
  ];

  return async function maintenanceMiddleware(req, res, next) {
    try {
      const maintenanceEnabled = await settingsService.isMaintenanceEnabled();
      if (!maintenanceEnabled) return next();

      const originalUrl = req.originalUrl || '';
      if (publicPrefixes.some((prefix) => originalUrl.startsWith(prefix))) {
        return next();
      }

      const token = req.cookies?.token;
      if (token) {
        try {
          const user = jwt.verify(token, jwtSecret);
          const role = user?.role;
          if (['admin', 'superAdmin'].includes(role)) {
            return next();
          }
        } catch {
          // fall through to maintenance block
        }
      }

      return res.status(503).json({
        message: 'System is in maintenance mode',
        maintenance: true,
      });
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  createMaintenanceMiddleware,
};
