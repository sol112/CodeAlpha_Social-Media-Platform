// ### `backend/controllers/userController.js`
// This controller handles all user-related logic, including registration, login, and profile management.

// ```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDbConnection } = require('../database');

const secretKey = 'your_secret_key'; // <<<-- Change this in a real application

// Register a new user
exports.register = async (req, res) => {
    const { username, email, password, ImgLink } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = getDbConnection();
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password, profile_picture_url) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, ImgLink]
        );
        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// User login
exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const connection = getDbConnection();
        const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful!', token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Get a user's profile
exports.getProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const connection = getDbConnection();
        const [users] = await connection.execute(
            'SELECT id, username, email, bio, profile_picture_url FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[0];

        // Get post count
        const [postCountResult] = await connection.execute(
            'SELECT COUNT(*) AS count FROM posts WHERE user_id = ?', [userId]
        );
        user.postCount = postCountResult[0].count;

        // Get follower count
        const [followerCountResult] = await connection.execute(
            'SELECT COUNT(*) AS count FROM followers WHERE followed_id = ?', [userId]
        );
        user.followerCount = followerCountResult[0].count;
        
        // Get following count
        const [followingCountResult] = await connection.execute(
            'SELECT COUNT(*) AS count FROM followers WHERE follower_id = ?', [userId]
        );
        user.followingCount = followingCountResult[0].count;

        res.status(200).json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error fetching user profile.' });
    }
};

// Follow a user
exports.followUser = async (req, res) => {
    const { followedId } = req.body;
    const followerId = req.user.id; // From JWT token

    if (followerId === parseInt(followedId)) {
        return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    try {
        const connection = getDbConnection();
        await connection.execute(
            'INSERT INTO followers (follower_id, followed_id) VALUES (?, ?)',
            [followerId, followedId]
        );
        res.status(200).json({ message: 'User followed successfully.' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: 'Server error during follow operation.' });
    }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
    const { followedId } = req.params;
    const followerId = req.user.id; // From JWT token

    try {
        const connection = getDbConnection();
        const [result] = await connection.execute(
            'DELETE FROM followers WHERE follower_id = ? AND followed_id = ?',
            [followerId, followedId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Follow relationship not found.' });
        }
        res.status(200).json({ message: 'User unfollowed successfully.' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ message: 'Server error during unfollow operation.' });
    }
};

// Check if the current user is following a specific user
exports.isFollowing = async (req, res) => {
    const { userId } = req.params;
    const followerId = req.user.id; // From JWT token

    try {
        const connection = getDbConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?',
            [followerId, userId]
        );
        res.status(200).json({ isFollowing: rows.length > 0 });
    } catch (error) {
        console.error('Is following check error:', error);
        res.status(500).json({ message: 'Server error checking follow status.' });
    }
};

