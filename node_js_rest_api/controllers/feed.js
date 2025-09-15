
const fs =  require('fs');
const path = require('path');

// Importing validationResult from express-validator
// npm install --save express-validator
const { validationResult } = require('express-validator');

// Importing the Post model
const Post  = require('../models/post');

const User = require('../models/user');

exports.getPosts = (req, res, next) => {

    const currentPage = req.query.page || 1; // Get the current page from query params, default to 1
    const pageSize = 2; // Number of posts per page
    let totalItems;

    // Fetch posts from the database
    Post.find()

    .countDocuments()
        .then( count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * pageSize) // Skip the posts of previous pages
                .limit(pageSize); // Limit the number of posts to pageSize
        })
        .then(posts => {
            res.status(200)
                .json({
                    message: 'Fetched posts successfully.',
                    posts: posts,
                    totalItems: totalItems
                })
            ;
        })
        .catch( err => {
            if(!err.statusCode) {
                err.statusCode = 500; // Internal Server Error
            }
            next(err); // Pass the error to the error handling middleware
        })
    ;

        // .then(posts => {
        //     res.status(200).json({
        //         message: 'Fetched posts successfully.',
        //         posts: posts
        //     });
        // })
        // .catch(err => {
        //     if (!err.statusCode) {
        //         err.statusCode = 500; // Internal Server Error
        //     }
        //     next(err);
        // });
    ;

    // res.status(200).json(
    //     {
    //         posts:
    //         [
    //             {
    //                 _id: 'p1',
    //                 title: 'First Post',
    //                 content: 'This is the first post!',
    //                 imageUrl: 'images/Bharat101 Plus 4G.png',
    //                 creator: {
    //                     name: 'Max Schwarz'
    //                 },
    //                 createdAt: new Date().toISOString()
    //             }, 
    //             {
    //                 _id: 'p2',
    //                 title: 'Second Post',
    //                 content: 'This is the second post!',
    //                 imageUrl: 'images/Bharat101 Plus 4G.png',
    //                 creator: {
    //                     name: 'Max Schwarz'
    //                 },
    //                 createdAt: new Date().toISOString()
    //             }
    //         ]
    //     }
    // )

};



exports.createPost = (req, res, next) => {

    // Validate the request body
    const erros = validationResult(req);
    if (!erros.isEmpty()) {

        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422; // Unprocessable Entity
        // Throw will exist the current function and pass the error to the next middleware
        throw error;

        // return res.status(422).json({
        //     message: 'Validation failed, entered data is incorrect.',
        //     errors: erros.array()
        // });
    }
    
    if(!req.file){
        const error = new Error('No image provided.');
        error.statusCode = 422; // Unprocessable Entity
        throw error;
    }
    
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\" ,"/") ?? 'images/Bharat101 Plus 4G.png';

    console.log(title, content, imageUrl, 'createPost Node App');

    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });

    post.save()
        .then(result => {
            // console.log('Created Post', result);

            res.status(201).json({
                message: 'Post created successfully',
                post: result
            });
        })
        .catch( err => {
            console.error(err);
            if (!err.statusCode) {
                err.statusCode = 500; // Internal Server Error
            }
            next(err); // Pass the error to the error handling middleware
        } )
    ;

    // res.status(201).json({
    //     message: 'Post created successfully',
    //     post: {
    //         _id: 'p3',
    //         title: title,
    //         content: content,
    //         imageUrl: imageUrl,
    //         creator: {
    //             name: 'Max Schwarz'
    //         },
    //         createdAt: new Date().toISOString()
    //     }
    // });

}


exports.getPost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404; // Not Found
                throw error;
            }

            console.log(post, 'getPost Node App');
            res.status(200).json({ message: 'Post fetched.', post: post });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500; // Internal Server Error
            }
            next(err);
        })
    ;
};


exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;

    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    if (!title || !content) {
        const error = new Error('Title and content are required.');
        error.statusCode = 422; // Unprocessable Entity
        throw error;
    }

    // Check if an image was uploaded
    let imageUrl = req.file ? req.file.path.replace("\\","/") : req.body.image; // Use existing image if not updated
    if (!imageUrl) {
        const error = new Error('No image provided.');
        error.statusCode = 422; // Unprocessable Entity
        throw error;
    }

    Post.findById(postId)
        .then(post => {
            
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404; // Not Found
                throw error;
            }

            // If the image is updated, remove the old image
            if(imageUrl !== post.imageUrl) {
                removeImage(post.imageUrl);
            }

            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;

            return post.save();
        })  
        .then(result => {
            res.status(200).json({ message: 'Post updated!', post: result });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500; // Internal Server Error
            }
            next(err);
        });
    ;
}


exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
           
            // Check if the post exists
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }

            // Remove the image file from the server
            removeImage(post.imageUrl);

            // Delete the post from the database
            // return Post.findByIdAndRemove(postId);
            return Post.findByIdAndDelete(postId);

        })
        .then(result => {
            console.log(result);
            res.status(200).json({ message: 'Deleted post.' });
        })
        .catch(err => {
            if (!err.statusCode) {
            err.statusCode = 500;
            }
            next(err);
        })
    ;
};


const removeImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => { console.log(err); });
};