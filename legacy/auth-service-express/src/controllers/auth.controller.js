// auth-service/src/controllers/auth.controller.js
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { pool } = require('../config/db')

// ── Helper: generate tokens ───────────────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  })

  return { accessToken, refreshToken }
}

// ── REGISTER ─────────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password, role = 'donor' } = req.body

  try {
    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, is_verified, created_at`,
      [name, email, hashedPassword, role]
    )

    const user = result.rows[0]
    const { accessToken, refreshToken } = generateTokens(user)

    // Store refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    )

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id:          user.id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        is_verified: user.is_verified,
      },
      token:        accessToken,
      refreshToken: refreshToken,
    })

  } catch (err) {
    console.error('Register error:', err.message)
    return res.status(500).json({ message: 'Server error during registration' })
  }
}

// ── LOGIN ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body

  try {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const { accessToken, refreshToken } = generateTokens(user)

    // Store refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    )

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id:          user.id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        is_verified: user.is_verified,
      },
      token:        accessToken,
      refreshToken: refreshToken,
    })

  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ message: 'Server error during login' })
  }
}

// ── LOGOUT ────────────────────────────────────────────────────
const logout = async (req, res) => {
  const { refreshToken } = req.body

  try {
    if (refreshToken) {
      await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]
      )
    }
    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('Logout error:', err.message)
    return res.status(500).json({ message: 'Server error during logout' })
  }
}

// ── GET ME (protected) ────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.status(200).json({ user: result.rows[0] })
  } catch (err) {
    console.error('GetMe error:', err.message)
    return res.status(500).json({ message: 'Server error' })
  }
}

// ── REFRESH TOKEN ─────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body

  if (!token) {
    return res.status(401).json({ message: 'Refresh token required' })
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

    // Check token exists in DB
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' })
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    )
    const user = userResult.rows[0]

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return res.status(200).json({ token: newAccessToken })

  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' })
  }
}

module.exports = { register, login, logout, getMe, refreshToken }