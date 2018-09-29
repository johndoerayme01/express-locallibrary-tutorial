var BookInstance = require('../models/bookinstance');
var Book = require("../models/book");

const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
    .populate("book")
    .exec((err, list_bookinstance) => {
        if (err) {
            return next(err);
        } else {
            res.render("bookinstance_list", {title: "Book Instance List", bookinstance_list: list_bookinstance});
        }
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookinstance) => {
            if (err) {
                return next(err);
            }

            if (bookinstance == null) {
                const err = new Error("Book copy not found!");
                err.status = 404;
                return next(err);
            }

            // SUCCESS!
            res.render("bookinstance_detail", {title: "Book:", bookinstance: bookinstance}, )
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, "title")
        .exec((err, books) => {
            if (err) { return next(err); }

            res.render("bookinstance_form", { title: "Create BookInstance", books: books});
        });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // Validate input
    body("book", "Book must be specified").trim().isLength({min:1}),
    body("imprint", "Imprint must be specified").trim().isLength({min:1}),
    body("due_back", "Invalid date").optional({checkFalsy: true}).isISO8601(),
    // Sanitize input
    sanitizeBody("book").trim().escape(),
    sanitizeBody("imprint").trim().escape(),
    sanitizeBody("status").trim().escape(),
    sanitizeBody("due_back").toDate(),
    // Handle request
    (req, res, next) => {
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status
        });

        if (!errors.isEmpty()) {
            Book.find({}, "title")
                .exec((err, books) => {
                    if (err) { return next(err); }
                    console.log(req.body.due_back);
                    res.render("bookinstance_form", { title: "Create BookInstance", bookinstance: bookinstance, books: books, errors: errors.array() });
                });
            return;
        }

        bookinstance.save((err) => {
            if (err) { return next(err); }

            res.redirect(bookinstance.url);
        });
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance delete GET');
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance delete POST');
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};