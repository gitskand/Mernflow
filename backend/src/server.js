require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
app.set('trust proxy', true);

// Security
app.use(helmet());
app.use(express.json());
app.use(cookieParser());


const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map(o => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (curl, server-side)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ CORS blocked origin:", origin);
        return callback(new Error("CORS not allowed for: " + origin), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiter
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

// DB connect
connectDB();

const FRONTEND_ORIGIN = 'https://dynamic-muffin-0e080d.netlify.app';

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true, // if you use cookies or auth that requires credentials
}));

// bad: app.set('trust proxy', true)
app.set('trust proxy', 'loopback'); // or false


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Start server
const PORT = parseInt(process.env.PORT, 10) || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));