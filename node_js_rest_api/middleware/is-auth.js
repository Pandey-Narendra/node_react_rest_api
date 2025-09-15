// middleware/is-auth.js
// npm install --save jsonwebtoken
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    
    // Extract the Authorization header
    const authHeader = req.get('Authorization');
    
    if (!authHeader) {
        const error = new Error('Not authenticated.');
        error.statusCode = 401; // Unauthorized
        throw error;
    }
    
    // Split the header to get the token
    const token = authHeader.split(' ')[1];
    let decodedToken;
    
    try {
        // Verify the token using the secret key
        decodedToken = jwt.verify(token, 'somesupersecretsecret');
    } catch (err) {
        err.statusCode = 500; // Internal Server Error
        throw err;
    }
    
    // Check if the token is valid
    if (!decodedToken) {
        const error = new Error('Not authenticated.');
        error.statusCode = 401; // Unauthorized
        throw error;
    }
    
    // Attach the userId from the token to the request object
    req.userId = decodedToken.userId;
    next();
}