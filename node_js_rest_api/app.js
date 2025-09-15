// INSTALL

// npm init
// npm install --save express
// npm install --save-dev nodemon
const express = require('express');

// Importing body-parser to parse JSON request bodies
// npm install --save body-parser
const bodyParser = require('body-parser');


// npm install --save mongoose
const mongoose = require('mongoose');

// Importing routes
const feedRoutes = require('./routes/feed');


const authRoutes = require('./routes/auth');

// Create an Express application
const app = express();


// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded parser <form>
app.use(bodyParser.json()); // JSON parser


// Configure multer for file uploads
// npm install --save multer
const multer = require('multer');
// Importing uuid for generating unique filenames
// npm install --save uuid
const { v4: uuidv4 } = require('uuid');

// Configure multer storage for uploaded files (uuid for windows compatibility)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, uuidv4())
    }
});


const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
}

// Configure multer middleware
app.use(
    multer({ storage: storage, fileFilter: fileFilter }).single('image')
);

// Serving static files for request /images  
const path = require('path');
app.use(
    
    '/images',
    express.static(
        path.join(__dirname, 'images')
    )

);

// Middleware to handle CORS (Cross-Origin Resource Sharing)
app.use( (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
} );


// Middleware to parse JSON request bodies
app.use('/feed', feedRoutes);

app.use('/auth', authRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    const status = error.statusCode || 500;
    const message = error.message || 'An error occurred.';
    const data = error.data || [];
    res.status(status).json({ message: message, data: data });
});


// Connect to MongoDB
const username = encodeURIComponent("NodeLearningUser");
const password = encodeURIComponent("devnaren");
const MONGODB_URI = `mongodb+srv://${username}:${password}@nodelearning.nvpzxls.mongodb.net/api`;

mongoose.connect(MONGODB_URI)
    .then(() => {
        // console.log('Connected to MongoDB');
        app.listen(8080);
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
    });
;
