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

    // Applications table: stores application information, including video and movie name
    db.run(`CREATE TABLE IF NOT EXISTS Applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, -- Movie name
        status TEXT NOT NULL DEFAULT 'new', -- 'new', 'pending', 'accepted', 'rejected'
        description TEXT NOT NULL,
        video TEXT, -- Stores the file path of the video
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating Applications table:', err.message);
        } else {
            console.log('Applications table created or already exists.');
        }
    });

    // Insert some sample data
    db.run(`
        INSERT INTO Applications (name, status, description, video) 
        VALUES
        ('Movie 1', 'new', 'Sample description 1', 'https://example.com/sample_video1.mp4'),
        ('Movie 2', 'new', 'Sample description 2', 'https://example.com/sample_video2.mp4'),
        ('Movie 3', 'new', 'Sample description 3', 'https://example.com/sample_video3.mp4'),
        ('Movie 4', 'new', 'Sample description 4', 'https://example.com/sample_video4.mp4'),
        ('Movie 5', 'new', 'Sample description 5', 'https://example.com/sample_video5.mp4'),
        ('Movie 6', 'new', 'Sample description 6', 'https://example.com/sample_video6.mp4'),
        ('Movie 7', 'new', 'Sample description 7', 'https://example.com/sample_video7.mp4'),
        ('Movie 8', 'new', 'Sample description 8', 'https://example.com/sample_video8.mp4'),
        ('Movie 9', 'new', 'Sample description 9', 'https://example.com/sample_video9.mp4'),
        ('Movie 10', 'new', 'Sample description 10', 'https://example.com/sample_video10.mp4');
    `, (err) => {
        if (err) {
            console.error('Error inserting into Applications table:', err.message);
        } else {
            console.log('Sample data inserted into Applications table.');
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
