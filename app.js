require('dotenv').config(); // Load environment variables

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

// Load environment secrets
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

// Validate Mongo URI
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  vehicleNo: { type: String, default: null },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const parkingSlotSchema = new mongoose.Schema({
  parkingAreaId: Number,
  areaName: String,
  slotNumber: Number,
  occupied: Boolean,
  carNumber: String,
  bookingTime: Date,
});

const User = mongoose.model('User', userSchema);
const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);

// Initialize slots
async function initializeParkingSlots() {
  const count = await ParkingSlot.countDocuments();
  if (count === 0) {
    const slots = [];
    for (let area = 1; area <= 4; area++) {
      for (let i = 1; i <= 50; i++) {
        slots.push({
          parkingAreaId: area,
          areaName: `Area ${area}`,
          slotNumber: i,
          occupied: false,
          carNumber: null,
        });
      }
    }
    await ParkingSlot.insertMany(slots);
    console.log('✅ Parking slots initialized');
  }
}
initializeParkingSlots();

// Admin config
const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  email: process.env.ADMIN_EMAIL,
  mobile: process.env.ADMIN_MOBILE,
  employeeId: process.env.ADMIN_EMPLOYEE_ID,
};

// Create admin if not exists
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

// JWT Middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
}

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

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid username/email or password' });
    }

    const token = jwt.sign(
      { username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });

    return res.redirect(user.role === 'admin' ? '/dashboard' : '/user-panel');
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
    const exists = await User.findOne({ $or: [{ employeeId }, { username }, { email }] });
    if (exists) {
      return res.render('register', { error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = username === ADMIN_CONFIG.username && email === ADMIN_CONFIG.email ? 'admin' : 'user';

    const newUser = new User({ username, email, password: hashedPassword, mobile, employeeId, role });
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.render('register', { error: 'Registration failed. Try again.' });
  }
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { errorMessage: null, successMessage: null });
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render('forgot-password', { errorMessage: 'Invalid email', successMessage: null });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('forgot-password', { errorMessage: 'No account found', successMessage: null });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `http://${req.headers.host}/reset-password?token=${token}`;
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      text: `Reset your password here: ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);
    res.render('forgot-password', { successMessage: 'Email sent', errorMessage: null });
  } catch (err) {
    console.error('❌ Email error:', err);
    res.render('forgot-password', { errorMessage: 'Error sending email', successMessage: null });
  }
});

app.get('/reset-password', async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.send('Invalid or expired token.');
  res.render('reset-password', { token, errorMessage: null });
});

app.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    return res.render('reset-password', { token, errorMessage: 'Passwords do not match.' });
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) return res.send('Token invalid or expired.');

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.send('✅ Password reset. <a href="/login">Login</a>.');
});

app.get('/user-panel', authenticateToken, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).send('Access denied');

  try {
    const user = await User.findOne({ username: req.user.username });
    const slots = await ParkingSlot.find({});

    // Find the slot booked by the current user's vehicle (if any)
    const bookedSlot = await ParkingSlot.findOne({ carNumber: user.vehicleNo });

    res.render('user-panel', {
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      employeeId: user.employeeId,
      vehicleNo: user.vehicleNo,
      slots: groupSlotsByArea(slots),
      bookedSlot: bookedSlot || null, // Ensure it's defined
    });
  } catch (err) {
    console.error('❌ Error loading user panel:', err);
    res.status(500).send('Failed to load user panel');
  }
});


app.get('/dashboard', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');

  const [users, slots] = await Promise.all([User.find({}), ParkingSlot.find({})]);

  res.render('dashboard', {
    users,
    slots: groupSlotsByArea(slots),
    admin: req.user,
    releaseSuccess: req.query.releaseSuccess ? true : false
  });
});


app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

app.get('/available-slots', async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ occupied: false });
    res.json(slots);
  } catch {
    res.status(500).json({ error: 'Failed to get slots' });
  }
});

app.post('/book-slot', authenticateToken, async (req, res) => {
  const { slotId, vehicleNo } = req.body;

  if (!slotId || !vehicleNo) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const user = await User.findOne({ username: req.user.username });
  if (user.vehicleNo) {
    return res.status(400).json({ error: 'You have already booked a slot.' });
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

    user.vehicleNo = vehicleNo;
    await user.save();

    res.json({ slotNumber: slot.slotNumber, areaName: slot.areaName });
  } catch (err) {
    console.error('Booking Error:', err);
    res.status(500).json({ error: 'Booking failed' });
  }
});
app.get('/user-status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'user') return res.status(403).send('Access denied');

  try {
    const slots = await ParkingSlot.find({});
    const areas = {};

    slots.forEach(slot => {
      if (!areas[slot.areaName]) {
        areas[slot.areaName] = { total: 0, occupied: 0 };
      }
      areas[slot.areaName].total++;
      if (slot.occupied) areas[slot.areaName].occupied++;
    });

    Object.keys(areas).forEach(area => {
      areas[area].available = areas[area].total - areas[area].occupied;
    });

    res.render('user-status', { username: req.user.username, statusData: areas });
  } catch (err) {
    console.error('❌ User Status error:', err);
    res.status(500).send('Error loading parking status');
  }
});
// Release the currently‑parked car’s slot
app.post('/release-slot', async (req, res) => {
  let { vehicleNo } = req.body;
  vehicleNo = vehicleNo.trim();

  try {
    const slot = await ParkingSlot.findOne({ carNumber: { $regex: vehicleNo, $options: 'i' } });

    if (!slot) {
      return res.status(404).json({ message: 'No slot found for this vehicle number.' });
    }

    slot.occupied = false;
    slot.carNumber = null;
    slot.bookingTime = null;
    await slot.save();

    await User.updateOne(
      { vehicleNo: vehicleNo },
      {
        $set: { vehicleNo: null },
        $unset: { bookedSlot: "" }
      }
    );

    console.log(`Slot released: ${slot.slotNumber} in ${slot.areaName}`);

    // ✅ Correct: Respond with JSON for fetch()
    return res.json({ message: 'Slot released successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error while releasing slot.' });
  }
});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


app.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,  // Display user name, real sender is your Gmail
    to: 'weparksy@gmail.com',
    replyTo: email,  // 👈 When you hit "Reply", it'll go to the user's email
    subject: `New Contact Message from ${name} - ${subject}`,
    text: `
You have received a new message from ParkSy contact form.

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.send('Something went wrong. Please try again later.');
    } else {
      console.log('Email sent: ' + info.response);
      res.render('thank-you', { redirectTo: '/' }); // or '/dashboard' or any page

    }
  });
});
app.post('/assign', async (req, res) => {
  const { area, slotNumber, employeeId } = req.body;

  try {
    const slot = await ParkingSlot.findOneAndUpdate(
      { areaName: area, slotNumber: parseInt(slotNumber) },
      {
        occupied: true,
        employeeId,
        carNumber: `CAR-${employeeId}`, // or get from DB if needed
        bookingTime: new Date()
      },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found.' });
    }

    await User.updateOne(
      { employeeId },
      {
        $set: {
          vehicleNo: `CAR-${employeeId}`,
          bookedSlot: {
            area,
            slotNumber: parseInt(slotNumber)
          }
        }
      }
    );

    console.log(`Slot assigned: ${slot.slotNumber} in ${slot.areaName} to ${employeeId}`);
    res.json({
      message: 'Slot assigned successfully.',
      vehicleNo: `CAR-${employeeId}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error assigning slot.' });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
