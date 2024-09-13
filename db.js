const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to the SQLite database
const db = new sqlite3.Database(path.resolve(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Initialize the tables
        createTables();


    }
});

// Function to create the necessary database tables
function createTables() {
    // Users table: stores user information
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL, -- 'public' or 'staff'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating Users table:', err.message);
        } else {
            console.log('Users table created or already exists.');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS Messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  admin_reply TEXT,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES Users(id)
);
`, (err) => {
        if (err) {
            console.error('Error creating Users table:', err.message);
        } else {
            console.log('Users table created or already exists.');
        }
    });
    // Videos table: stores video information, including name and description
    db.run(`CREATE TABLE IF NOT EXISTS Videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE, -- Movie name
        status TEXT NOT NULL DEFAULT 'new', -- 'new', 'pending', 'accepted', 'rejected'
        description TEXT NOT NULL,
        video TEXT, -- Stores the file path of the video
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating Videos table:', err.message);
        } else {
            console.log('Videos table created or already exists.');
        }
    });

    // Insert sample data only if the record does not already exist
    db.run(`
    INSERT OR IGNORE INTO Videos (name, status, description, video) 
    VALUES
    ('Movie 1', 'new', 'Sample description 1', 'https://example.com/sample_video1.mp4'),
    ('Movie 2', 'new', 'Sample description 2', 'https://example.com/sample_video2.mp4'),
    ('Movie 3', 'new', 'Sample description 3', 'https://example.com/sample_video3.mp4'),
    ('Movie 4', 'new', 'Sample description 4', 'https://example.com/sample_video4.mp4'),
    ('Movie 5', 'new', 'Sample description 5', 'https://example.com/sample_video5.mp4');
`, (err) => {
        if (err) {
            console.error('Error inserting into Videos table:', err.message);
        } else {
            console.log('Sample data inserted or ignored if already exists.');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS Rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id INTEGER NOT NULL,
    rental_date DATETIME NOT NULL,
    return_date DATETIME,
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'pending', 'returned', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (video_id) REFERENCES Videos(id)
)`, (err) => {
        if (err) {
            console.error('Error creating Rentals table:', err.message);
        } else {
            console.log('Rentals table created or already exists.');
        }
    });

}

// Export the database object to be used in other modules
module.exports = db;
