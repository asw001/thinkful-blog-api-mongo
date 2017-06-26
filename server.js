const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(morgan('common'));
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {BlogPosts} = require('./models');


app.get('/posts/', (req, res) => {
    BlogPosts.find()
        .exec()
        .then(posts => {
            res.json(posts.map(post => post.apiRepr()));
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                error: 'ERROR: there was a problem retrieving records'
            });
        });
});

app.get('/posts/:id', (req, res) => {
    BlogPost
        .findById(req.params.id)
        .exec()
        .then(post => res.json(post.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({
                error: 'ERROR: there was a problem retrieving the record'
            });
        });
});

app.post('/posts/', (req, res) => {
    const requiredFields = ['title', 'content', 'author'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message);
        }
   }
    BlogPost.create({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author
        })
        .then(blogPost => res.status(201).json(blogPost.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({
                error: 'ERROR: there was a problem submitting your blog post'
            })
        });
});

app.delete('posts/:id', (req, res) => {
    BlogPosts.findByIdAndRemove(req.params.id)
        .exec()
        .then(() => {
            res.status(204).json({
                message: 'INFO: post successfully deleted'
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({
                error: 'ERROR: there was a problem deleting the blog post'
            });
        });
});

app.put('posts/:id', (req, res) => {
    const requiredFields = ['title', 'content', 'author'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing \`${field}\` in request body`
            console.error(message);
            return res.status(400).send(message);
        }
    }
    if (req.params.id !== req.body.id) {
        const message = (
            `Request path id (${req.params.id}) and request body id `
            `(${req.body.id}) must match`);
        console.error(message);
        return res.status(400).send(message);
    }
    console.log(`Updating blog post \`${req.params.id}\``);

    const updated = {};
    const updateableFields = ['title', 'content', 'author'];
    updateableFields.forEach(field => {
        if (field in req.body) {
            updated[field] = req.body[field];
        }
    });
    BlogPost.findByIdAndUpdate(req.params.id, {
            $set: updated
        }, {
            new: true
        })
        .exec()
        .then(updatedPost => res.status(204).json(updatedPost.apiRepr()))
    .catch(err => res.status(500).json({
        message: 'ERROR: there was a problem updating the post'
    }));
});

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                    console.log(`Your app is listening on port ${port}`);
                    resolve();
                })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Closing server');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = {app,runServer,closeServer};