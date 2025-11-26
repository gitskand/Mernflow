require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();



app.use(cors({
  origin: '',
  credentials: true
}));



app.get('/', (req, res) => {
  res.redirect('https://dynamic-muffin-0e080d.netlify.app/');
});


app.use(helmet());
app.use(express.json());
app.use(cookieParser());



app.set('trust proxy', 'loopback');


const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://dynamic-muffin-0e080d.netlify.app/'
];
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: function (origin, callback) {

      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn('❌ CORS blocked origin:', origin);
      return callback(new Error('CORS not allowed for: ' + origin), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);


app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);


app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => {
  res.send('Task Manager Backend — server is running. Use the API endpoints.');
});


const frontendDistPath = path.join(__dirname, 'frontend-dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}


const PORT = parseInt(process.env.PORT, 10) || 5001;

connectDB()
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);

    app.listen(PORT, () =>
      console.log(`Server running on ${PORT} (DB connection failed)`)
    );
  });

module.exports = app;
