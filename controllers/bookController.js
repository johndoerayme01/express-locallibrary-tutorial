var Book = require("../models/book");
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance");
var async = require("async")

const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

exports.index = (req, res) => {
    let bookCount = Book.countDocuments();
    let bookInstanceCount = BookInstance.countDocuments();
    let bookInstanceAvailableCount = BookInstance.countDocuments({status: "Available"});
    let authorCount = Author.countDocuments();
    let genreCount = Genre.countDocuments();

    
    Promise.all([bookCount, bookInstanceCount, bookInstanceAvailableCount, authorCount, genreCount])
        .then((result) => {
            res.render("index", {
                title: "Local Library Home", data: result
            });
        })
        .catch(err => console.log(err));
};

exports.book_list = (req, res, next) => {
    Book.find({}, "title author")
        .populate('author')
        .exec((err, list_books) => {
            if (err) { return next(err); }
            // Successful, so render
            res.render('book_list', {title: "Book List", book_list: list_books});
        });
};

// Display detail page for a specific book.
exports.book_detail = function(req, res, next) {

    async.parallel({
        book: function(callback) {

            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {

          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_detail', { title: 'Title', book:  results.book, book_instances: results.book_instance } );
    });

};

// Display book create form on GET.
exports.book_create_get = function(req, res, next) {
    const authors = Author.find();
    const genres = Genre.find();

    Promise.all([authors, genres])
    .then(results => {
        const authors = results[0];
        const genres = results[1];
        
        res.render("book_form", { title: "Create Book", authors: authors, genres: genres });
        return;
    })
    .catch(err => next(err));
}

// Handle book create on POST.
exports.book_create_post = [
    (req, res, next) => {
        // If only one genre was selected, convert it to an array
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") {
                req.body.genre = [];
            } else {
                req.body.genre = [req.body.genre];
            }
        }
        return next();
    },

    // Validate input
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize input
    sanitizeBody("*").trim().escape(),
    sanitizeBody("genre.*").trim().escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        if (!errors.isEmpty()) {
            const authors = Author.find();
            const genres = Genre.find();

            Promise.all([authors, genres])
                .then(results => {
                    const authors = results[0];
                    const genres = results[1];

                    for (let i = 0; i < genres.length; i++) {
                        if (book.genre.indexOf(genres[i]._id) > -1) {
                            genres[i].checked = "true";
                        }
                    }

                    res.render("book_form", { title: "Create Book", authors: authors, genres: genres, book: book, errors: errors.array()});
                    return;
                })
                .catch(err => { return next(err) });
        } else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function(req, res) {
    const book = Book.findById(req.params.id).populate("author").populate("genre");
    const authors = Author.find();
    const genres = Genre.find();

    Promise.all([book, authors, genres])
        .then(results => {
            const book = results[0];
            const authors = results[1];
            const genres = results[2];

            if (book == null) {
                var err = new Error("Book not found");
                err.status = 400;
                return next(err);
            } else {
                for (let i = 0; i < genres.length; i++) {
                    console.log("i: " + genres[i].name)
                    for (let j = 0; j < book.genre.length; j++) {
                        console.log("j: " + book.genre[j].name);
                        if (genres[i]._id.toString() == book.genre[j]._id.toString()) {
                            genres[i].checked = "true";
                            console.log("SAME!")
                        }
                    }
                }
            }
            for (let i = 0; i < genres.length; i++) {
                console.log(Object.getOwnPropertyNames(genres[i]));
            }
            res.render("book_form", { title: "Update Book", authors: authors, genres: genres, book: book});
            return;
        }).catch(err => { return next(err); });
};

// Handle book update on POST.
exports.book_update_post = [
    // If single genre chosen, convert to array. Otherwise, if no genre chosen, make empty array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") {
                req.body.genre = [];
            } else {
                req.body.genre = [req.body.genre];
            }
        }
        next();
    },

    // Validate input
    body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize input
    sanitizeBody('*').trim().escape(),
    sanitizeBody('genre.*').trim().escape(),

    // Handle request
    (req, res, next) => {
        const errors = validationResult(req)

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
            _id: req.params.id
        });

        if (!errors.isEmpty()) {
            const authors = Author.find();
            const genres = Genre.find();

            Promise.all([authors, genres])
                .then(results => {
                    const authors = results[0];
                    const genres = results[1];

                    for (let i = 0; i < genres.length; i++) {
                        if (book.genre.indexOf(genres[i]._id) > -1) {
                            genres[i].checked = "true";
                        }
                    }
                    res.render('book_form', { title: 'Update Book',authors: authors, genres: genres, book: book, errors: errors.array() });
                    return;
                })
                .catch(err => { return next(err); });
        } else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebook.url);
                });
        }
    }
]
