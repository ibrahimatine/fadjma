const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized: User role not found' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      // user's role is not authorized
      return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
    }

    // authentication and authorization successful
    next();
  };
};

module.exports = authorize;