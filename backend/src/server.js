// require('dotenv').config();
// const express = require('express');
// const cookieParser = require('cookie-parser');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const cors = require('cors');
// const connectDB = require('./config/db');

// const authRoutes = require('./routes/auth');
// const taskRoutes = require('./routes/tasks');

// const app = express();
// app.set('trust proxy', true);

// // Security
// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());


// const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
//   .split(",")
//   .map(o => o.trim());

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // allow requests with no origin (curl, server-side)
//       if (!origin) return callback(null, true);

//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       } else {
//         console.log("❌ CORS blocked origin:", origin);
//         return callback(new Error("CORS not allowed for: " + origin), false);
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Rate limiter
// const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
// app.use(limiter);

// // DB connect
// connectDB();

// const FRONTEND_ORIGIN = 'https://dynamic-muffin-0e080d.netlify.app';

// app.use(cors({
//   origin: FRONTEND_ORIGIN,
//   credentials: true, // if you use cookies or auth that requires credentials
// }));

// // bad: app.set('trust proxy', true)
// app.set('trust proxy', 'loopback'); // or false


// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/tasks', taskRoutes);

// // Health check
// app.get('/health', (req, res) => res.json({ ok: true }));

// // Start server
// const PORT = parseInt(process.env.PORT, 10) || 5001;
// app.listen(PORT, () => console.log(`Server running on ${PORT}`));


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

// --------------------------
// Security & parsing
// --------------------------
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// set a safe trust proxy value (don't set to true)
app.set('trust proxy', 'loopback');

// --------------------------
// CORS
// --------------------------
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://dynamic-muffin-0e080d.netlify.app'
];
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server requests/no-origin requests (curl, Postman)
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

// --------------------------
// Rate limiter
// --------------------------
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

// --------------------------
// API routes
// --------------------------
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// --------------------------
// Simple health & root routes
// --------------------------
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => {
  res.send('Task Manager Backend — server is running. Use the API endpoints.');
});

// --------------------------
// Serve frontend if build exists
// --------------------------
const frontendDistPath = path.join(__dirname, 'frontend-dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  // Place this after API routes so it doesn't override them
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// --------------------------
// Start server after DB connection
// --------------------------
const PORT = parseInt(process.env.PORT, 10) || 5001;

connectDB()
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Start server anyway so you can see errors in runtime; helpful for debugging
    app.listen(PORT, () =>
      console.log(`Server running on ${PORT} (DB connection failed)`)
    );
  });

module.exports = app;
