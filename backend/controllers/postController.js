// ### `backend/controllers/postController.js`
// This controller handles all logic for creating posts, commenting, and liking.

// ```javascript
const { getDbConnection } = require('../database');

// Create a new post
exports.createPost = async (req, res) => {
    const { content, imageUrl } = req.body;
    const userId = req.user.id; // From JWT token

    if (!content) {
        return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

    try {
        const connection = getDbConnection();
        const [result] = await connection.execute(
            'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
            [userId, content, imageUrl]
        );
        res.status(201).json({ message: 'Post created successfully!', postId: result.insertId });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Server error creating post.' });
    }
};

// Get a single post and its comments
exports.getPost = async (req, res) => {
    const { postId } = req.params;

    try {
        const connection = getDbConnection();
        // Fetch the post
        const [posts] = await connection.execute(
            `SELECT p.*, u.username, u.profile_picture_url
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [postId]
        );
        if (posts.length === 0) {
            return res.status(404).json({ message: 'Post not found.' });
        }
        const post = posts[0];

        // Fetch comments for the post
        const [comments] = await connection.execute(
            `SELECT c.*, u.username, u.profile_picture_url
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`,
            [postId]
        );
        post.comments = comments;

        // Fetch like count for the post
        const [likes] = await connection.execute(
            'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = ?',
            [postId]
        );
        post.likeCount = likes[0].like_count;

        res.status(200).json(post);
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Server error fetching post.' });
    }
};

// Get all posts for the feed (can be modified to show posts from followed users)
exports.getFeed = async (req, res) => {
    try {
        const connection = getDbConnection();
        const [posts] = await connection.execute(
            `SELECT p.*, u.username, u.profile_picture_url,
                    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS commentCount,
                    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likeCount
             FROM posts p
             JOIN users u ON p.user_id = u.id
             ORDER BY p.created_at DESC`
        );
        res.status(200).json(posts);
    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({ message: 'Server error fetching feed.' });
    }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id; // From JWT token

    if (!content) {
        return res.status(400).json({ message: 'Comment content cannot be empty.' });
    }

    try {
        const connection = getDbConnection();
        const [result] = await connection.execute(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );
        res.status(201).json({ message: 'Comment added successfully!', commentId: result.insertId });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error adding comment.' });
    }
};

// Like or unlike a post
exports.toggleLike = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id; // From JWT token

    try {
        const connection = getDbConnection();

        // Check if the user has already liked the post
        const [likes] = await connection.execute(
            'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (likes.length > 0) {
            // If already liked, unlike it (delete the entry)
            await connection.execute(
                'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            res.status(200).json({ message: 'Post unliked successfully.', liked: false });
        } else {
            // If not liked, like it (insert a new entry)
            await connection.execute(
                'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
                [postId, userId]
            );
            res.status(200).json({ message: 'Post liked successfully.', liked: true });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ message: 'Server error toggling like.' });
    }
};

