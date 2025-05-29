const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Models and Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  vehicleNo: { type: String, default: null }
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

// Middleware & Config
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parking_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

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

// Admin config from environment or defaults
const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME || 'superadmin',
  password: process.env.ADMIN_PASSWORD || 'SecurePass123!',
  email: process.env.ADMIN_EMAIL || 'admin@company.com',
  mobile: process.env.ADMIN_MOBILE || '9876543210',
  employeeId: process.env.ADMIN_EMPLOYEE_ID || 'EMP001',
};

// Create admin user if not exists
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

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
}

// Helper to group parking slots by area for dashboard rendering
function groupSlotsByArea(slots) {
  const grouped = {};
  slots.forEach(slot => {
    if (!grouped[slot.areaName]) {
      grouped[slot.areaName] = [];
    }
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

app.post('/park-car', authenticateToken, async (req, res) => {
  try {
    const { vehicleNo } = req.body;
    const updatedUser = await User.findOneAndUpdate({ username: req.user.username }, { vehicleNo }, { new: true });

    if (!updatedUser) return res.status(404).send('❌ User not found');

    res.redirect('/user-panel?success=Vehicle parked successfully!');
  } catch (err) {
    console.error('❌ Error parking car:', err);
    res.status(500).send('❌ Error parking car: ' + err.message);
  }
});

app.get('/dashboard', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect('/user-panel');

  try {
    const slots = await ParkingSlot.find({});
    const groupedSlots = groupSlotsByArea(slots);

    res.render('dashboard', { user: req.user.username, groupedSlots });
  } catch (err) {
    console.error('❌ Dashboard error:', err);
    res.redirect('/login');
  }
});

app.get('/user-panel', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    const successMessage = req.query.success || null;
    res.render('userPanel', { user, successMessage });
  } catch (err) {
    console.error("❌ Error loading user panel:", err);
    res.redirect('/login');
  }
});

// Admin creation, reset routes (optional)
app.get('/create-admin', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) return res.send('⚠️ Admin already exists: ' + existingAdmin.username);

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
    res.send(`✅ Admin user created: ${ADMIN_CONFIG.username}`);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    res.status(500).send('❌ Admin creation failed');
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
