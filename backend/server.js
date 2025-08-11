// ### `backend/server.js`
// This is the main Express server file. It sets up the routes and connects to the database.

// ```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('./database');
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');

const app = express();
const port = 3000;
const secretKey = 'your_secret_key'; // Must match the one in userController.js

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 'Bearer TOKEN'

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
};

// User Routes
app.post('/api/register', userController.register);
app.post('/api/login', userController.login);
app.get('/api/users/:userId', userController.getProfile);
app.post('/api/users/follow', authenticateToken, userController.followUser);
app.delete('/api/users/:followedId/unfollow', authenticateToken, userController.unfollowUser);
app.get('/api/users/:userId/is-following', authenticateToken, userController.isFollowing);

// Post & Feed Routes
app.get('/api/posts/feed', authenticateToken, postController.getFeed);
app.post('/api/posts', authenticateToken, postController.createPost);
app.get('/api/posts/:postId', authenticateToken, postController.getPost);
app.post('/api/posts/:postId/comments', authenticateToken, postController.addComment);
app.post('/api/posts/:postId/like', authenticateToken, postController.toggleLike);

// Start the server after connecting to the database
connectToDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
