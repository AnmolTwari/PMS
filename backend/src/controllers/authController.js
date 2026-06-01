const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { serializeUser } = require('../utils/parking');

function createAuthController({ jwtSecret }) {
  async function register(req, res) {
    const { name, email, password, mobile, employeeId, department, role = 'visitor' } = req.body;
    const resolvedName = (name || '').trim();
    const username = resolvedName;

    if (!resolvedName || !email || !password || !mobile || !employeeId) {
      return res.status(400).json({ message: 'Name, email, phone, employee ID and password are required' });
    }

    const existing = await User.findOne({
      $or: [
        { username: resolvedName },
        { email },
        { mobile },
        { employeeId },
      ],
    });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'superadmin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@company.com';
    const roleFromRequest = ['superAdmin', 'admin', 'securityGuard', 'employee', 'student', 'visitor'].includes(role) ? role : 'visitor';
    const derivedRole = resolvedName === adminUsername && email === adminEmail ? 'superAdmin' : roleFromRequest;
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: resolvedName,
      username,
      email,
      password: hashedPassword,
      mobile,
      employeeId,
      department,
      role: derivedRole,
      isLoggedIn: false,
    });

    return res.status(201).json({ message: 'Account created successfully' });
  }

  async function login(req, res) {
    const { identifier, username, password } = req.body;
    const loginValue = (identifier || username || '').trim();

    if (!loginValue || !password) {
      return res.status(400).json({ message: 'Email, phone, employee ID or password is required' });
    }

    const user = await User.findOne({
      $or: [
        { email: loginValue },
        { mobile: loginValue },
        { employeeId: loginValue },
        { username: loginValue },
        { name: loginValue },
      ],
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    user.isLoggedIn = true;
    await user.save();

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
    });

    return res.json({ user: serializeUser(user) });
  }

  async function logout(req, res) {
    await User.updateOne({ username: req.user.username }, { $set: { isLoggedIn: false } });
    res.clearCookie('token');
    return res.json({ message: 'Logged out' });
  }

  async function me(req, res) {
    const token = req.cookies.token;
    if (!token) {
      return res.json({ user: null });
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      const user = await User.findById(payload.id);
      if (!user) {
        return res.json({ user: null });
      }

      return res.json({ user: serializeUser(user) });
    } catch {
      return res.json({ user: null });
    }
  }

  return {
    register,
    login,
    logout,
    me,
  };
}

module.exports = {
  createAuthController,
};