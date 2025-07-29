// backend/src/api/auth/auth.controller.js
    import pool from '../../models/db.js';
    import jwt from 'jsonwebtoken';
    import bcrypt from 'bcryptjs';

    export const login = async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
      }
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !user.password) {
          return res.status(401).json({ error: 'Invalid credentials.' });
        }
        if (user.persona_type !== 'admin') {
          return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, persona_type: user.persona_type }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, persona_type: user.persona_type } });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };
