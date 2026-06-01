const jwt = require('jsonwebtoken');

function createAuthMiddleware(jwtSecret) {
  function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      req.user = jwt.verify(token, jwtSecret);
      return next();
    } catch {
      return res.status(401).json({ message: 'Session expired' });
    }
  }

  function requireRole(role) {
    return (req, res, next) => {
      const currentRole = req.user?.role;

      if (role === 'user') {
        const isAllowedUser = ['visitor', 'student', 'employee', 'securityGuard'].includes(currentRole);
        if (!isAllowedUser) {
          return res.status(403).json({ message: 'Access denied' });
        }

        return next();
      }

      if (role === 'admin') {
        const isAllowedAdmin = ['admin', 'superAdmin'].includes(currentRole);
        if (!isAllowedAdmin) {
          return res.status(403).json({ message: 'Access denied' });
        }

        return next();
      }

      if (currentRole !== role) {
        return res.status(403).json({ message: 'Access denied' });
      }

      return next();
    };
  }

  return {
    authenticateToken,
    requireRole,
  };
}

module.exports = {
  createAuthMiddleware,
};