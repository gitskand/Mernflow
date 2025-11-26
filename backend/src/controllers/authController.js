const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const signAccess = (user) => {
  return jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m' });
};

const signRefresh = (user) => {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + (parseDuration(process.env.REFRESH_TOKEN_EXPIRES || '7d')));
  return { token, expiresAt };
};

// parse simple durations like '7d' or '15m' to ms
function parseDuration(str) {
  if (!str) return 0;
  if (str.endsWith('d')) return parseInt(str) * 24*60*60*1000;
  if (str.endsWith('h')) return parseInt(str) * 60*60*1000;
  if (str.endsWith('m')) return parseInt(str) * 60*1000;
  return parseInt(str);
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'user' });

    const access = signAccess(user);
    const { token, expiresAt } = signRefresh(user);
    await RefreshToken.create({ token, user: user._id, expiresAt });
    // set httpOnly cookie
    res.cookie('refreshToken', token, { httpOnly: true, sameSite: 'lax', path: '/api/auth/refresh', secure: false, expires: expiresAt });
    return res.status(201).json({ accessToken: access, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const access = signAccess(user);
    const { token, expiresAt } = signRefresh(user);
    await RefreshToken.create({ token, user: user._id, expiresAt });
    res.cookie('refreshToken', token, { httpOnly: true, sameSite: 'lax', path: '/api/auth/refresh', secure: false, expires: expiresAt });
    return res.json({ accessToken: access, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    const doc = await RefreshToken.findOne({ token }).populate('user');
    if (!doc) return res.status(401).json({ message: 'Invalid refresh token' });
    if (doc.expiresAt < new Date()) {
      await doc.remove();
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    const user = doc.user;
    const access = signAccess(user);
    return res.json({ accessToken: access, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) await RefreshToken.deleteOne({ token });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
