const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

// Security & Parsing Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cadets', require('./routes/cadets'));
app.use('/api/officers', require('./routes/officers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/camps', require('./routes/camps'));
app.use('/api/events', require('./routes/events'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/news', require('./routes/news'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cadet Connection Portal API is running' });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
