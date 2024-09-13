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
  console.log(authHeader);
  
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
// Videos CRUD operations (Renamed from Applications)
// =============================

// Create a new video
router.post('/videos', function(req, res, next) {
  const { name, status, description, video } = req.body;
  const sql = `INSERT INTO Videos (name, status, description, video) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, status, description, video], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ videoId: this.lastID });
  });
});

// Get all videos
router.get('/videos', function(req, res, next) {
  const { name, status, page = 1, pageSize = 5 } = req.query;

  let sql = `SELECT * FROM Videos WHERE 1=1`; 
  let countSql = `SELECT COUNT(*) as total FROM Videos WHERE 1=1`;
  
  const params = [];
  const countParams = [];

  // 为 name 添加筛选条件
  if (name) {
    sql += ` AND name LIKE ?`;
    countSql += ` AND name LIKE ?`;
    params.push(`%${name}%`);
    countParams.push(`%${name}%`);
  }

  // 为 status 添加筛选条件
  if (status) {
    sql += ` AND status = ?`;
    countSql += ` AND status = ?`;
    params.push(status);
    countParams.push(status);
  }

  db.get(countSql, countParams, (err, countRow) => {
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


// Get a specific video by ID
router.get('/videos/:id', function(req, res, next) {
  const { id } = req.params;
  db.get(`SELECT * FROM Videos WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

// Update a video by ID
router.put('/videos/:id', function(req, res, next) {
  const { id } = req.params;
  const { status, description, video } = req.body;
  const sql = `UPDATE Videos SET status = ?, description = ?, video = ? WHERE id = ?`;
  db.run(sql, [status, description, video, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

// Delete a video by ID
router.delete('/videos/:id', function(req, res, next) {
  const { id } = req.params;
  db.run(`DELETE FROM Videos WHERE id = ?`, [id], function(err) {
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
  const { user_id, video_id, message } = req.body; // Updated to reference video_id
  const sql = `INSERT INTO Messages (user_id, video_id, message) VALUES (?, ?, ?)`;
  db.run(sql, [user_id, video_id, message], function(err) {
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


router.post('/applications', authenticateToken, function(req, res, next) {
  const { item, description } = req.body;
  const userId = req.user.userId; 

  const sql = `INSERT INTO Applications (user_id, item, description) VALUES (?, ?, ?)`;
  db.run(sql, [userId, item, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ applicationId: this.lastID });
  });
});

router.get('/applications', function(req, res, next) {
  const sql = `SELECT * FROM Applications`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows); // Returns all rental applications
  });
});

router.put('/applications/:id/status', function(req, res, next) {
  const { id } = req.params; // Application ID
  const { status } = req.body; // New status: 'pending', 'accepted', 'rejected'

  const sql = `UPDATE Applications SET status = ? WHERE id = ?`;
  db.run(sql, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

router.get('/applications/:id', function(req, res, next) {
  const { id } = req.params;
  const sql = `SELECT * FROM Applications WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});


// Create a new rental
router.post('/rentals', authenticateToken, (req, res) => {
  const { video_id, rental_date } = req.body;
  const user_id = req.user.userId; 

  const sql = `INSERT INTO Rentals (user_id, video_id, rental_date, status) VALUES (?, ?, ?, 'new')`;
  db.run(sql, [user_id, video_id, rental_date], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ rentalId: this.lastID });
  });
});

// Get all rentals
router.get('/rentals', authenticateToken, (req, res) => {
  const sql = `SELECT Rentals.*, Users.username, Videos.name AS video_name 
               FROM Rentals 
               JOIN Users ON Rentals.user_id = Users.id 
               JOIN Videos ON Rentals.video_id = Videos.id`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get rental by ID
router.get('/rentals/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const sql = `SELECT Rentals.*, Users.username, Videos.name AS video_name 
               FROM Rentals 
               JOIN Users ON Rentals.user_id = Users.id 
               JOIN Videos ON Rentals.video_id = Videos.id
               WHERE Rentals.id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

// Update rental status
router.put('/rentals/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;  // 'new', 'pending', 'returned', 'cancelled'

  const sql = `UPDATE Rentals SET status = ? WHERE id = ?`;
  db.run(sql, [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

// Delete rental
router.delete('/rentals/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM Rentals WHERE id = ?`;
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(204).end();
  });
});
module.exports = router;
