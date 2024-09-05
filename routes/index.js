var express = require('express');
var router = express.Router();
var db = require('../db'); // Import the database connection
var bcrypt = require('bcryptjs'); // For hashing passwords
var jwt = require('jsonwebtoken'); // For generating JWT tokens

const JWT_SECRET = 'JWTSK'; // Replace this with a secure secret key

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/register', async function(req, res, next) {
  const { username, password, email, role } = req.body;

  // Check if the user already exists
  db.get(`SELECT * FROM Users WHERE email = ? OR username = ?`, [email, username], async (err, user) => {
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const sql = `INSERT INTO Users (username, password, email, role) VALUES (?, ?, ?, ?)`;
      db.run(sql, [username, hashedPassword, email, role], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ userId: this.lastID });
      });
    }
  });
});

// =============================
// User Login
// =============================

router.post('/login', function(req, res, next) {
  const { username, password } = req.body;

  // Retrieve the user from the database
  db.get(`SELECT * FROM Users WHERE username = ?`, [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  });
});

router.get('/protected', authenticateToken, function(req, res, next) {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// =============================
// Users CRUD operations
// =============================

// Create a new user
router.post('/users', function(req, res, next) {
  const { username, password, email, role } = req.body;
  const sql = `INSERT INTO Users (username, password, email, role) VALUES (?, ?, ?, ?)`;
  db.run(sql, [username, password, email, role], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ userId: this.lastID });
  });
});

// Get all users
router.get('/users', function(req, res, next) {
  db.all(`SELECT * FROM Users`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a specific user by ID
router.get('/users/:id', function(req, res, next) {
  const { id } = req.params;
  db.get(`SELECT * FROM Users WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

// Update a user by ID
router.put('/users/:id', function(req, res, next) {
  const { id } = req.params;
  const { username, password, email, role } = req.body;
  const sql = `UPDATE Users SET username = ?, password = ?, email = ?, role = ? WHERE id = ?`;
  db.run(sql, [username, password, email, role, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

// Delete a user by ID
router.delete('/users/:id', function(req, res, next) {
  const { id } = req.params;
  db.run(`DELETE FROM Users WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(204).end();
  });
});


// =============================
// Applications CRUD operations
// =============================

// Create a new application
router.post('/applications', function(req, res, next) {
  const { user_id, status, description, photo, video } = req.body;
  const sql = `INSERT INTO Applications (user_id, status, description, photo, video) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [user_id, status, description, photo, video], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ applicationId: this.lastID });
  });
});

// Get all applications
router.get('/applications', function(req, res, next) {
  const { name, status, page = 1, pageSize = 5 } = req.query;

  let sql = `SELECT * FROM Applications WHERE 1=1`; 
  const params = [];

  if (name) {
    sql += ` AND name LIKE ?`;
    params.push(`%${name}%`);
  }

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  const countSql = `SELECT COUNT(*) as total FROM Applications WHERE 1=1`;
  let totalParams = [...params];

  db.get(countSql, totalParams, (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const total = countRow.total;

    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows, total });
    });
  });
});




// Get a specific application by ID
router.get('/applications/:id', function(req, res, next) {
  const { id } = req.params;
  db.get(`SELECT * FROM Applications WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

// Update an application by ID
router.put('/applications/:id', function(req, res, next) {
  const { id } = req.params;
  const { status, description, photo, video } = req.body;
  const sql = `UPDATE Applications SET status = ?, description = ?, photo = ?, video = ? WHERE id = ?`;
  db.run(sql, [status, description, photo, video, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

// Delete an application by ID
router.delete('/applications/:id', function(req, res, next) {
  const { id } = req.params;
  db.run(`DELETE FROM Applications WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(204).end();
  });
});


// =============================
// Messages CRUD operations
// =============================

// Create a new message
router.post('/messages', function(req, res, next) {
  const { user_id, application_id, message } = req.body;
  const sql = `INSERT INTO Messages (user_id, application_id, message) VALUES (?, ?, ?)`;
  db.run(sql, [user_id, application_id, message], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ messageId: this.lastID });
  });
});

// Get all messages
router.get('/messages', function(req, res, next) {
  db.all(`SELECT * FROM Messages`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get a specific message by ID
router.get('/messages/:id', function(req, res, next) {
  const { id } = req.params;
  db.get(`SELECT * FROM Messages WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

// Update a message by ID
router.put('/messages/:id', function(req, res, next) {
  const { id } = req.params;
  const { message } = req.body;
  const sql = `UPDATE Messages SET message = ? WHERE id = ?`;
  db.run(sql, [message, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

// Delete a message by ID
router.delete('/messages/:id', function(req, res, next) {
  const { id } = req.params;
  db.run(`DELETE FROM Messages WHERE id = ?`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(204).end();
  });
});

module.exports = router;
