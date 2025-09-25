// Middleware to add WebSocket functionality to request object
const websocketMiddleware = (req, res, next) => {
  // Add WebSocket instance to request
  req.io = req.app.get('io');
  next();
};

module.exports = websocketMiddleware;