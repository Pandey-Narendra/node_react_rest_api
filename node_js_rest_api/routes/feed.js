const express = require('express');

// npm install --save express-validator
const { body } = require('express-validator');

// Importing the feed controller
const feedController = require('../controllers/feed');

// Importing the isAuth middleware to protect routes
// npm install --save jsonwebtoken  
const isAuth = require('../middleware/is-auth');


const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post(
    '/post', 
    isAuth,
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 }),
    ], 
    feedController.createPost
);

// GET /feed/post/:postId
router.get('/post/:postId', isAuth, feedController.getPost);

// PUT /feed/post/:postId
router.put(
    '/post/:postId',
    isAuth,
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 }),
    ], 
    feedController.updatePost
);

// DELETE /feed/post/:postId
router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;