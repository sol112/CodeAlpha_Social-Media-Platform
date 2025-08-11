// ### `frontend/script.js`
// This file contains the client-side JavaScript to handle user interactions and communicate with the backend.
// ```javascript

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');

    // --- Authentication Check & Redirects ---
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    
    if (!token && !isLoginPage && !isRegisterPage) {
        window.location.href = 'login.html';
    } else if (token && (isLoginPage || isRegisterPage)) {
        window.location.href = 'index.html';
    }

    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = 'login.html';
        });
    }

    // --- Registration Page Logic ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const ImgLink = document.getElementById('register-ImgLink').value;
            

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, ImgLink })
                });

                const result = await response.json();
                if (response.ok) {
                    alert('Registration successful! Please log in.');
                    window.location.href = 'login.html';
                } else {
                    alert('Registration failed: ' + result.message);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }

    // --- Login Page Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('userId', result.user.id);
                    window.location.href = 'index.html';
                } else {
                    alert('Login failed: ' + result.message);
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    // --- Post Feed Page Logic ---
    const postsContainer = document.getElementById('posts-container');
    const createPostForm = document.getElementById('create-post-form');
    
    if (postsContainer) {
        fetchFeed();
    }
    
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = document.getElementById('post-content').value;
            const imageUrl = document.getElementById('post-image-url').value;
            await createPost(content, imageUrl);
            createPostForm.reset();
            fetchFeed(); // Refresh the feed
        });
    }

    async function fetchFeed() {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/posts/feed`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const posts = await response.json();
            displayPosts(posts);
        } catch (error) {
            console.error('Error fetching feed:', error);
        }
    }

    async function createPost(content, imageUrl) {
        if (!token) return;
        try {
            await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content, imageUrl })
            });
        } catch (error) {
            console.error('Error creating post:', error);
        }
    }

    async function checkLikeStatus(postId) {
        if (!token) return false;
        try {
            const response = await fetch(`${API_URL}/posts/${postId}/like-status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            return result.liked;
        } catch (error) {
            console.error('Error checking like status:', error);
            return false;
        }
    }

    async function checkFollowStatus(userId) {
        if (!token) return false;
        try {
            const response = await fetch(`${API_URL}/users/${userId}/is-following`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            return result.isFollowing;
        } catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    }

    async function fetchPostWithDetails(postId) {
        if (!token) return null;
        try {
            const response = await fetch(`${API_URL}/posts/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching post details:', error);
            return null;
        }
    }

    function displayPosts(posts) {
        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-author-info">
                        <a href="profile.html?id=${post.user_id}" class="post-author profile-link">${post.username}</a>
                        <span class="post-meta">${new Date(post.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                    ${post.image_url ? `<img src="${post.image_url}" alt="Post image">` : ''}
                </div>
                <div class="post-actions">
                    <div class="post-interaction-btns">
                        <button class="action-btn like-btn" data-post-id="${post.id}">
                            <i class="far fa-heart"></i>
                            <span class="like-count">Like ${post.likeCount}</span>
                        </button>
                        <button class="action-btn comment-btn" data-post-id="${post.id}">
                            <i class="far fa-comment"></i>
                            <span class="comment-count">Comment ${post.commentCount}</span>
                        </button>
                    </div>
                    ${post.user_id != currentUserId ? `<button class="follow-btn" data-user-id="${post.user_id}">Follow</button>` : ''}
                </div>
                <div class="comments-section" data-post-id="${post.id}">
                    <!-- Comments will be loaded here on click -->
                    <form class="comment-form" style="display:none;">
                        <input type="text" placeholder="Add a comment..." required>
                        <button type="submit">Post</button>
                    </form>
                </div>
            `;
            postsContainer.appendChild(postElement);
        });

        // Add event listeners for interaction buttons
        postsContainer.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.currentTarget.dataset.postId;
                await toggleLike(postId);
                fetchFeed(); // Refresh feed to show updated counts
            });
        });

        postsContainer.querySelectorAll('.comment-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.currentTarget.dataset.postId;
                const commentsSection = postsContainer.querySelector(`.comments-section[data-post-id="${postId}"]`);
                const commentForm = commentsSection.querySelector('.comment-form');
                
                // Toggle comment form and fetch comments if not already visible
                if (commentForm.style.display === 'none') {
                    commentForm.style.display = 'flex';
                    await fetchCommentsAndDisplay(postId, commentsSection);
                } else {
                    commentForm.style.display = 'none';
                }
            });
        });

        postsContainer.querySelectorAll('.comments-section .comment-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const postId = e.target.closest('.comments-section').dataset.postId;
                const content = e.target.querySelector('input').value;
                await addComment(postId, content);
                e.target.reset();
                const commentsSection = e.target.closest('.comments-section');
                await fetchCommentsAndDisplay(postId, commentsSection); // Refresh comments
                fetchFeed(); // Refresh post count
            });
        });

        postsContainer.querySelectorAll('.follow-btn').forEach(button => {
            const userId = button.dataset.userId;
            checkFollowStatus(userId).then(isFollowing => {
                if (isFollowing) {
                    button.textContent = 'Unfollow';
                    button.classList.add('unfollow');
                } else {
                    button.textContent = 'Follow';
                    button.classList.remove('unfollow');
                }
            });

            button.addEventListener('click', async () => {
                await toggleFollow(userId);
                // Update the button text after the action
                checkFollowStatus(userId).then(isFollowing => {
                    if (isFollowing) {
                        button.textContent = 'Unfollow';
                        button.classList.add('unfollow');
                    } else {
                        button.textContent = 'Follow';
                        button.classList.remove('unfollow');
                    }
                });
            });
        });
    }

    async function toggleLike(postId) {
        if (!token) return;
        try {
            await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    async function addComment(postId, content) {
        if (!token || !content) return;
        try {
            await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    }

    async function fetchCommentsAndDisplay(postId, commentsSection) {
        const postDetails = await fetchPostWithDetails(postId);
        if (postDetails && postDetails.comments) {
            const commentsHtml = postDetails.comments.map(comment => `
                <div class="comment">
                    <span class="comment-author">${comment.username}</span>
                    <span class="comment-content">${comment.content}</span>
                </div>
            `).join('');
            commentsSection.insertAdjacentHTML('afterbegin', commentsHtml);
        }
    }
    
    async function toggleFollow(userId) {
        if (!token) return;
        const isFollowing = await checkFollowStatus(userId);
        try {
            if (isFollowing) {
                await fetch(`${API_URL}/users/${userId}/unfollow`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                await fetch(`${API_URL}/users/follow`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ followedId: userId })
                });
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    }
    

    // --- Profile Page Logic ---
    const profileContainer = document.getElementById('profile-container');
    const myProfileLink = document.getElementById('my-profile-link');

    if (myProfileLink && currentUserId) {
        myProfileLink.href = `profile.html?id=${currentUserId}`;
    }

    if (profileContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
        if (userId) {
            fetchUserProfile(userId);
        } else {
            profileContainer.innerHTML = `<p>User profile not found.</p>`;
        }
    }

    async function fetchUserProfile(userId) {
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const user = await response.json();
            displayUserProfile(user);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    function displayUserProfile(user) {
        profileContainer.innerHTML = `
            <div class="profile-header">
                <img src="${user.profile_picture_url || '[https://placehold.co/150x150/png?text=User](https://placehold.co/150x150/png?text=User)'}" alt="Profile Picture" class="profile-pic">
                <div class="profile-info">
                    <h2>${user.username}</h2>
                    <p class="profile-bio">${user.bio || 'No bio available.'}</p>
                </div>
                <div class="profile-stats">
                    <div>
                        <h3>${user.postCount}</h3>
                        <p>Posts</p>
                    </div>
                    <div>
                        <h3>${user.followerCount}</h3>
                        <p>Followers</p>
                    </div>
                    <div>
                        <h3>${user.followingCount}</h3>
                        <p>Following</p>
                    </div>
                </div>
                ${user.id != currentUserId ? `<button class="follow-btn" data-user-id="${user.id}">Follow</button>` : ''}
            </div>
        `;
        
        // Add follow/unfollow functionality to the profile button
        const followButton = profileContainer.querySelector('.follow-btn');
        if (followButton) {
            checkFollowStatus(user.id).then(isFollowing => {
                if (isFollowing) {
                    followButton.textContent = 'Unfollow';
                    followButton.classList.add('unfollow');
                } else {
                    followButton.textContent = 'Follow';
                    followButton.classList.remove('unfollow');
                }
            });
            followButton.addEventListener('click', async () => {
                await toggleFollow(user.id);
                fetchUserProfile(user.id); // Refresh profile to update follow count
            });
        }
    }
});
