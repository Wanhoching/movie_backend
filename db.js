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

    // Applications table: stores application information, including photo and video fields
    db.run(`CREATE TABLE IF NOT EXISTS Applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'new', -- 'new', 'pending', 'accepted', 'rejected'
        description TEXT NOT NULL,
        photo TEXT, -- Stores the file path of the photo
        video TEXT, -- Stores the file path of the video
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES Users(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating Applications table:', err.message);
        } else {
            console.log('Applications table created or already exists.');
        }
    });

    // Messages table: stores messages exchanged between users and staff
    db.run(`CREATE TABLE IF NOT EXISTS Messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        application_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES Users(id),
        FOREIGN KEY(application_id) REFERENCES Applications(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating Messages table:', err.message);
        } else {
            console.log('Messages table created or already exists.');
        }
    });
}

// Export the database object to be used in other modules
module.exports = db;
