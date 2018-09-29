var Genre = require('../models/genre');
var Book = require("../models/book");
const { body, validationResult} = require("express-validator/check")
const { sanitizeBody } = require("express-validator/filter")

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
    .sort({name: "ascending"})
    .exec((err, list_genres) => {
        if (err) {
            return next(err);
        } else {
            res.render("genre_list", {title: "Genre List", genre_list: list_genres});
        }
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    const genre = Genre.findById(req.params.id);
    const genre_books = Book.find({genre: req.params.id});

    Promise.all([genre, genre_books])
        .then((results) => {
            const genre = results[0];
            const genre_books = results[1];

            if (genre == null) {
                const err = new Error('Genre not found');
                err.status = 404;
                return next(err);
            }

            res.render("genre_detail", {title: "Genre Detail", genre: genre, genre_books: genre_books});
        })
        .catch(err => next(err));
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render("genre_form", {title: "Genre Form"});
};

// Handle Genre create on POST.
// [Validate, Sanitize, Handle req]
exports.genre_create_post = [
    // Validate input
    body("name", "genre is required").trim().isLength({min: 1}),
    // Sanitize input
    sanitizeBody("name").trim().escape(),
    // Handle req
    (req, res, next) => {
        const errors = validationResult(req);

        // Create genre object with escaped and trimmed data.
        const genre = new Genre({
            name: req.body.name
        });

        if (!errors.isEmpty()) {
            res.render("genre_form", { title: "Genre Form", genre: genre, errors: errors.array()});
        } else {
            Genre.findOne({name: req.body.name})
                .exec((err, genre_found) => {
                    if (err) { return next(err); }

                    if (genre_found) {
                        res.redirect(genre_found.url);
                    } else {
                        genre.save(err => {
                            if (err) { return next(err) }

                            res.redirect(genre.url);
                        });
                    }
                });
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};