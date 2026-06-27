const jwt = require('jsonwebtoken');
const User = require('../entities/User');
const Admin = require('../entities/Admin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find in User or Admin
      req.user = await User.findById(decoded.id).select('-password') || 
                 await Admin.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  // Check if req.user is an instance of Admin model or has a role property (Admin model has role)
  if (req.user && req.user.role) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password') || 
                 await Admin.findById(decoded.id).select('-password');
    } catch (error) {
      console.error('Optional token verification failed:', error.message);
    }
  }
  next();
};

module.exports = { protect, admin, optionalProtect };
