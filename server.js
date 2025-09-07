// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Config
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/z2a';
const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';

// Connect to MongoDB
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error', err));

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  roll: { type: String, unique: true, required: true },
  dob: Date,
  grade: String,
  subjects: [String],
  marks: [String],
  total: String,
  status: String
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

// ---------------------- Authentication Middleware ----------------------
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });

  const token = auth.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.admin = decoded;
    next();
  });
}

// ---------------------- Routes ----------------------

// Admin Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'Z2A' && password === '1234') {
    const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Bad credentials' });
});

// Create student
app.post('/api/students', authMiddleware, async (req, res) => {
  try {
    const data = req.body;

    // Ensure unique roll number
    const exists = await Student.findOne({ roll: data.roll });
    if (exists) return res.status(400).json({ message: 'Roll number must be unique' });

    const s = new Student(data);
    await s.save();
    res.json(s);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get all students
app.get('/api/students', authMiddleware, async (req, res) => {
  const list = await Student.find().sort({ createdAt: -1 });
  res.json(list);
});

// Get single student (by ID)
app.get('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update student
app.put('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    // Check for roll number conflicts
    const existing = await Student.findOne({ roll: data.roll, _id: { $ne: id } });
    if (existing) return res.status(400).json({ message: 'Roll number conflict' });

    const s = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete student
app.delete('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student search by roll + dob
app.post('/api/search', async (req, res) => {
  try {
    const { roll, dob } = req.body;
    if (!roll || !dob) return res.status(400).json({ message: 'roll and dob required' });

    const d = new Date(dob);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));

    const student = await Student.findOne({ roll, dob: { $gte: start, $lte: end } });
    if (!student) return res.status(404).json({ message: 'Not found' });

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------- Static Files ----------------------
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------------------- Server ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
