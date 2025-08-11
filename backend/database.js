// ### `backend/database.js`
// This script handles the connection to the MySQL database and creates the necessary tables. **Remember to update the connection details with your own credentials.**

// ```javascript
const mysql = require('mysql2/promise');

// Update these with your MySQL credentials
const dbConfig = {
    host: 'localhost',
    user: 'Forum-dev',
    password: 'root', // <<<-- Change this
    database: 'nati'
};

let connection;

async function connectToDatabase() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Successfully connected to MySQL database: nati');
        await createTables();
    } catch (error) {
        console.error('Error connecting to or initializing database:', error);
        throw error;
    }
}

async function createTables() {
    try {
        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                bio TEXT,
                profile_picture_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create posts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create comments table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create likes table (many-to-many relationship)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (post_id, user_id)
            )
        `);

        // Create followers table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS followers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                follower_id INT NOT NULL,
                followed_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_follower (follower_id, followed_id)
            )
        `);

        console.log('All tables checked/created successfully.');

    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

function getDbConnection() {
    if (!connection) {
        throw new Error('Database connection not established.');
    }
    return connection;
}

module.exports = {
    connectToDatabase,
    getDbConnection
};
