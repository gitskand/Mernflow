// const User = require('../models/User');
// const RefreshToken = require('../models/RefreshToken');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');

// const signAccess = (user) => {
//   return jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' });
// };

// const signRefresh = (user) => {
//   const token = uuidv4();
//   const expiresAt = new Date(Date.now() + (parseDuration(process.env.REFRESH_TOKEN_EXPIRES || '7d')));
//   return { token, expiresAt };
// };

// // parse simple durations like '7d' or '15m' to ms
// function parseDuration(str) {
//   if (!str) return 0;
//   if (str.endsWith('d')) return parseInt(str) * 24*60*60*1000;
//   if (str.endsWith('h')) return parseInt(str) * 60*60*1000;
//   if (str.endsWith('m')) return parseInt(str) * 60*1000;
//   return parseInt(str);
// }

// exports.signup = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
//     if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ message: 'Email already used' });
//     const hashed = await bcrypt.hash(password, 10);
//     const user = await User.create({ name, email, password: hashed, role: role || 'user' });

//     const access = signAccess(user);
//     const { token, expiresAt } = signRefresh(user);
//     await RefreshToken.create({ token, user: user._id, expiresAt });
//     // set httpOnly cookie
//     res.cookie('refreshToken', token, { httpOnly: true, sameSite: 'lax', path: '/api/auth/refresh', secure: false, expires: expiresAt });
//     return res.status(201).json({ accessToken: access, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) return res.status(400).json({ message: 'Missing' });
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'Invalid credentials' });
//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

//     const access = signAccess(user);
//     const { token, expiresAt } = signRefresh(user);
//     await RefreshToken.create({ token, user: user._id, expiresAt });
//     res.cookie('refreshToken', token, { httpOnly: true, sameSite: 'lax', path: '/api/auth/refresh', secure: false, expires: expiresAt });
//     return res.json({ accessToken: access, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.refresh = async (req, res) => {
//   try {
//     const token = req.cookies.refreshToken;
//     if (!token) return res.status(401).json({ message: 'No refresh token' });
//     const doc = await RefreshToken.findOne({ token }).populate('user');
//     if (!doc) return res.status(401).json({ message: 'Invalid refresh token' });
//     if (doc.expiresAt < new Date()) {
//       await doc.remove();
//       return res.status(401).json({ message: 'Refresh token expired' });
//     }
//     const user = doc.user;
//     const access = signAccess(user);
//     return res.json({ accessToken: access, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.logout = async (req, res) => {
//   try {
//     const token = req.cookies.refreshToken;
//     if (token) await RefreshToken.deleteOne({ token });
//     res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };



// backend/controllers/authController.js

// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// // ----------------------------
// // Helpers
// // ----------------------------
// function generateAccessToken(user) {
//   return jwt.sign(
//     {
//       id: user._id,
//       role: user.role,
//       email: user.email
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
//   );
// }

// function generateRefreshToken(user) {
//   return jwt.sign(
//     {
//       id: user._id
//     },
//     process.env.REFRESH_SECRET,
//     { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" }
//   );
// }

// function sendRefreshCookie(res, token) {
//   const cookieOptions = {
//     httpOnly: true,
//     path: '/api/auth/refresh',
//     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//     secure: process.env.NODE_ENV === 'production',
//     expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//   };

//   res.cookie('refreshToken', token, cookieOptions);
// }

// // ----------------------------
// // Signup
// // ----------------------------
// exports.signup = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const exists = await User.findOne({ email });
//     if (exists) return res.status(400).json({ message: "Email already in use" });

//     const hashed = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hashed,
//       role: role || "user"
//     });

//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user);

//     sendRefreshCookie(res, refreshToken);

//     return res.status(201).json({
//       message: "Signup successful",
//       accessToken,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });

//   } catch (err) {
//     console.error("Signup error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ----------------------------
// // Login
// // ----------------------------
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(400).json({ message: "Invalid email or password" });

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid)
//       return res.status(400).json({ message: "Invalid email or password" });

//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user);

//     sendRefreshCookie(res, refreshToken);

//     return res.status(200).json({
//       message: "Login successful",
//       accessToken,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });

//   } catch (err) {
//     console.error("Login error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ----------------------------
// // Refresh
// // ----------------------------
// exports.refresh = async (req, res) => {
//   try {
//     const token = req.cookies.refreshToken;

//     if (!token)
//       return res.status(401).json({ message: "No refresh token provided" });

//     jwt.verify(token, process.env.REFRESH_SECRET, async (err, decoded) => {
//       if (err)
//         return res.status(401).json({ message: "Invalid refresh token" });

//       const user = await User.findById(decoded.id);
//       if (!user)
//         return res.status(401).json({ message: "User no longer exists" });

//       const newAccess = generateAccessToken(user);
//       const newRefresh = generateRefreshToken(user);

//       sendRefreshCookie(res, newRefresh);

//       return res.json({
//         accessToken: newAccess,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role
//         }
//       });
//     });

//   } catch (err) {
//     console.error("Refresh error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ----------------------------
// // Logout
// // ----------------------------
// exports.logout = async (req, res) => {
//   try {
//     res.clearCookie('refreshToken', {
//       httpOnly: true,
//       path: '/api/auth/refresh',
//       sameSite: 'none',
//       secure: process.env.NODE_ENV === 'production'
//     });

//     return res.json({ message: "Logged out" });

//   } catch (err) {
//     console.error("Logout error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };



// authController.js
const jwt = require('jsonwebtoken');
const User = require('./User'); // adjust path if needed
const RefreshToken = require('./RefreshToken'); // if you have a model for refresh tokens
const bcrypt = require('bcryptjs');

const isProd = process.env.NODE_ENV === 'production';

/**
 * Helper to create JWT
 */
function createAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function createRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Example: signup handler (adjust validation as per your app)
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    // Save refreshToken in DB if you want to revoke later (optional)
    try {
      await RefreshToken.create({ token: refreshToken, userId: user._id });
    } catch (e) {
      console.warn('Could not save refresh token in DB:', e.message);
    }

    // Set cookie (secure/sameSite for cross-site cookies)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // sameSite none required when cross-site in prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Example: login handler
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    // Save refresh token to DB if you want to
    try {
      await RefreshToken.create({ token: refreshToken, userId: user._id });
    } catch (e) {
      console.warn('Could not save refresh token in DB:', e.message);
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Example: logout handler — clears cookie and optionally revokes token in DB
 */
exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      // remove from DB if you saved it
      try {
        await RefreshToken.deleteOne({ token });
      } catch (e) {
        console.warn('Could not remove refresh token from DB:', e.message);
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });

    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('logout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Example: refresh token endpoint
 */
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    // Optionally check that token exists in DB
    const saved = await RefreshToken.findOne({ token });
    if (!saved) return res.status(401).json({ message: 'Token revoked' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const accessToken = createAccessToken({ id: payload.id });
    return res.json({ accessToken });
  } catch (err) {
    console.error('refresh token error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
