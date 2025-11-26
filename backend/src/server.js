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

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/tasks', taskRoutes);

// // Health check
// app.get('/health', (req, res) => res.json({ ok: true }));

// // Start server
// const PORT = parseInt(process.env.PORT, 10) || 5001;
// app.listen(PORT, () => console.log(`Server running on ${PORT}`));


// backend/src/server.js
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

// // If running behind a proxy/load-balancer (Render provides one), trust it
// app.set('trust proxy', true);

// // Basic security middlewares
// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());

// // Rate limiter (basic protection)
// const limiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 120,
// });
// app.use(limiter);

// // -------------------------
// // CORS (multi-origin safe)
// // -------------------------
// // Provide CORS_ORIGIN as comma-separated list in env, e.g.:
// // CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://your-netlify-site.netlify.app
// const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174';
// const allowedOrigins = rawOrigins
//   .split(',')
//   .map((s) => s.trim())
//   .filter(Boolean);

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // allow requests with no origin (like server-to-server or curl)
//       if (!origin) return callback(null, true);

//       // if origin matches allowed list, allow it
//       if (allowedOrigins.indexOf(origin) !== -1) {
//         return callback(null, true);
//       }

//       // not allowed
//       console.warn('Blocked CORS request from origin:', origin);
//       return callback(new Error('CORS not allowed for origin: ' + origin), false);
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   })
// );

// // Connect to DB
// connectDB();

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/tasks', taskRoutes);

// // Simple health check
// app.get('/health', (req, res) => res.json({ ok: true }));

// // Global error handler (including CORS errors)
// app.use((err, req, res, next) => {
//   console.error('Global error handler:', err && err.message ? err.message : err);
//   if (err && /CORS not allowed for origin/.test(err.message)) {
//     return res.status(403).json({ message: 'CORS error: origin not allowed' });
//   }
//   const status = err && err.status ? err.status : 500;
//   return res.status(status).json({ message: err.message || 'Internal Server Error' });
// });

// // Start (use Render's provided PORT)
// const PORT = parseInt(process.env.PORT, 10) || 5001;
// app.listen(PORT, () => console.log(`Server running on ${PORT}`));


// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./db'); // assumes db.js exports a function
const authRoutes = require('./auth'); // your auth routes file (auth.js)
const taskRoutes = require('./tasks'); // your tasks routes file (tasks.js)

const app = express();

// Production detection
const isProd = process.env.NODE_ENV === 'production';

// trust proxy (Render provides a proxy)
app.set('trust proxy', 1);

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Configure CORS
// CORS_ORIGIN can be a comma separated list of allowed origins
const rawOrigins = process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // allow cookies to be sent
};
app.use(cors(corsOptions));

// Simple health check route (Render can use this)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Connect DB
connectDB().then(() => {
  console.log('DB connected (from server.js)');
}).catch(err => {
  console.error('DB connection failed (from server.js):', err);
  process.exit(1); // fail fast if DB not connected
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Root route (optional)
app.get('/', (req, res) => {
  res.send('API running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
});
