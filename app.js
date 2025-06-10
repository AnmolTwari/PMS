const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parking_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Schemas & Models
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  vehicleNo: { type: String, default: null },

  // Fields for password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const parkingSlotSchema = new mongoose.Schema({
  parkingAreaId: Number,
  areaName: String,
  slotNumber: Number,
  occupied: Boolean,
  carNumber: String,
});

const User = mongoose.model('User', userSchema);
const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);

// Initialize parking slots once if none exist
async function initializeParkingSlots() {
  const count = await ParkingSlot.countDocuments();
  if (count === 0) {
    const slots = [
      ...Array(50).fill().map((_, i) => ({ parkingAreaId: 1, areaName: 'Area 1', slotNumber: i + 1, occupied: false, carNumber: null })),
      ...Array(50).fill().map((_, i) => ({ parkingAreaId: 2, areaName: 'Area 2', slotNumber: i + 1, occupied: false, carNumber: null })),
      ...Array(50).fill().map((_, i) => ({ parkingAreaId: 3, areaName: 'Area 3', slotNumber: i + 1, occupied: false, carNumber: null })),
      ...Array(50).fill().map((_, i) => ({ parkingAreaId: 4, areaName: 'Area 4', slotNumber: i + 1, occupied: false, carNumber: null })),
    ];
    await ParkingSlot.insertMany(slots);
    console.log('✅ Parking slots initialized');
  }
}
initializeParkingSlots();

// Admin config
const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME || 'superadmin',
  password: process.env.ADMIN_PASSWORD || 'SecurePass123!',
  email: process.env.ADMIN_EMAIL || 'admin@company.com',
  mobile: process.env.ADMIN_MOBILE || '9876543210',
  employeeId: process.env.ADMIN_EMPLOYEE_ID || 'EMP001',
};

// Create initial admin user if not exists
async function createInitialAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);
      const newAdmin = new User({
        username: ADMIN_CONFIG.username,
        email: ADMIN_CONFIG.email,
        password: hashedPassword,
        mobile: ADMIN_CONFIG.mobile,
        employeeId: ADMIN_CONFIG.employeeId,
        role: 'admin',
      });
      await newAdmin.save();
      console.log('✅ Initial admin user created');
    } else {
      console.log('✅ Admin user already exists:', existingAdmin.username);
    }
  } catch (err) {
    console.error('❌ Error creating initial admin:', err);
  }
}
createInitialAdmin();

// JWT auth middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
}

// Helper function to group slots by area
function groupSlotsByArea(slots) {
  const grouped = {};
  slots.forEach(slot => {
    if (!grouped[slot.areaName]) grouped[slot.areaName] = [];
    grouped[slot.areaName].push(slot);
  });
  return grouped;
}

// Routes

app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) return res.render('login', { error: 'Invalid username/email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Invalid username/email or password' });

    const token = jwt.sign({ username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    if (user.role === 'admin') res.redirect('/dashboard');
    else res.redirect('/user-panel');
  } catch (err) {
    console.error('❌ Login error:', err);
    res.render('login', { error: 'Login failed! Please try again.' });
  }
});

app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
  const { username, email, password, mobile, employeeId } = req.body;
  if (!username || !email || !password || !mobile || !employeeId) {
    return res.render('register', { error: 'All fields are required' });
  }

  try {
    const userExists = await User.findOne({ $or: [{ employeeId }, { username }, { email }] });
    if (userExists) {
      return res.render('register', { error: 'User with this employee ID, username, or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let role = 'user';
    if (username === ADMIN_CONFIG.username && email === ADMIN_CONFIG.email) role = 'admin';

    const newUser = new User({ username, email, password: hashedPassword, mobile, employeeId, role });
    await newUser.save();
    res.redirect('/login');

  } catch (err) {
    console.error('❌ Registration error:', err);
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

// Forgot password page
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', {
    successMessage: null,
    errorMessage: null,
  });
});

// Forgot password POST
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render('forgot-password', {
      errorMessage: 'Please enter a valid email address',
      successMessage: null,
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('forgot-password', {
        errorMessage: 'No account with that email found.',
        successMessage: null,
      });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expireTime = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expireTime;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'anmoltiwari621@gmail.com',
        pass: 'zbibwvmywctyxuvb',
      },
    });

    const resetUrl = `http://${req.headers.host}/reset-password?token=${token}`;

    const mailOptions = {
      to: user.email,
      from: 'anmoltiwari621@gmail.com',
      subject: 'Password Reset Request',
      text: `You are receiving this because you (or someone else) requested the reset of your account password.\n\n
Please click the following link, or paste it into your browser to complete the process:\n\n
${resetUrl}\n\n
If you did not request this, please ignore this email.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.render('forgot-password', {
      successMessage: 'An email has been sent with password reset instructions.',
      errorMessage: null,
    });
  } catch (err) {
    console.error(err);
    res.render('forgot-password', {
      errorMessage: 'Something went wrong. Please try again later.',
      successMessage: null,
    });
  }
});

// Reset password GET (show form)
app.get('/reset-password', async (req, res) => {
  const token = req.query.token;

  if (!token) return res.send('Invalid or missing token.');

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.send('Password reset token is invalid or has expired.');

  res.render('reset-password', { token, errorMessage: null });
});

// Reset password POST (handle submission)
app.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token) return res.send('Invalid request.');

  if (password !== confirmPassword) {
    return res.render('reset-password', {
      token,
      errorMessage: 'Passwords do not match.',
    });
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.send('Password reset token is invalid or has expired.');

  // Hash the new password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.send('Your password has been reset successfully. You may now <a href="/login">login</a>.');
});

// User panel (protected)
app.get('/user-panel', authenticateToken, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).send('Access denied.');

  try {
    const user = await User.findOne({ username: req.user.username });
    const slots = await ParkingSlot.find({});
    const groupedSlots = groupSlotsByArea(slots);

    res.render('user-panel', {
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      employeeId: user.employeeId,
      vehicleNo: user.vehicleNo,
      slots: groupedSlots,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Admin dashboard (protected)
app.get('/dashboard', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send('Access denied.');
  }

  try {
    const [users, slots] = await Promise.all([
      User.find({}),
      ParkingSlot.find({})
    ]);

    const groupedSlots = groupSlotsByArea(slots);

    res.render('dashboard', {
      users,
      slots: groupedSlots,
      admin: req.user,
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).send('Server error');
  }
});


// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Return list of available slots
app.get('/available-slots', async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ occupied: false });
    res.json(slots);
  } catch {
    res.status(500).json({ error: 'Failed to get slots' });
  }
});

// Handle booking
app.post('/book-slot', authenticateToken, async (req, res) => {
  const { slotId, vehicleNo } = req.body;

  console.log("Incoming Booking Request:", { slotId, vehicleNo }); // ✅ Add this
  const user = await User.findOne({ username: req.user.username });

  // Check if user already has a vehicle assigned
  if (user.vehicleNo) {
    return res.status(400).json({ error: 'You have already booked a slot.' });
  }
  user.vehicleNo = vehicleNo;
  await user.save();

  if (!slotId || !vehicleNo) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const slot = await ParkingSlot.findById(slotId);
    if (!slot || slot.occupied) {
      return res.status(400).json({ error: 'Slot not available' });
    }

    slot.occupied = true;
    slot.carNumber = vehicleNo;
    slot.bookingTime = new Date();
    await slot.save();

    res.json({ slotNumber: slot.slotNumber, areaName: slot.areaName });
  } catch (err) {
    console.error('Booking Error:', err); // ✅ Add error logging
    res.status(500).json({ error: 'Booking failed' });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
