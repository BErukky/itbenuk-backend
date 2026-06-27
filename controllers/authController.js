const jwt = require('jsonwebtoken');
const User = require('../entities/User');
const bcrypt = require('bcryptjs');
const Admin = require('../entities/Admin');
const UserDTO = require('../dtos/UserDTO');
const AdminDTO = require('../dtos/AdminDTO');

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Per BE-2-03
  });

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json(UserDTO.format(user));
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  try {
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash: password, // The pre-save hook will hash this
    });

    if (user) {
      sendTokenResponse(user, 201, res);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+passwordHash');

    if (user && (await user.matchPassword(password))) {
      sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new admin
// @route   POST /api/admins/register
// @access  Public (or semi-private depending on requirements)
const registerAdmin = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await Admin.create({
      username,
      email,
      password,
      role,
    });

    if (admin) {
      // Note: Admin token response should also be updated to use cookies if desired
      res.status(201).json(AdminDTO.format(admin));
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth admin & get token
// @route   POST /api/admins/login
// @access  Public
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      // Generate a token for the admin
      const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      // Return the admin data along with the token in the response body
      const adminData = AdminDTO.format(admin);
      res.json({ ...adminData, token });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout or /api/admins/logout
// @access  Public
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: {} });
};

module.exports = {
  registerUser,
  loginUser,
  registerAdmin,
  loginAdmin,
  logout,
};
