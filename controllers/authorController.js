var Author = require("../models/author");
var Book = require("../models/book");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter")

// Display list of all authors.
exports.author_list = (req, res, next) => {
    Author.find()
        .sort({family_name: "asc"})
        .exec((err, list_authors) => {
            if (err) {
                return next(err);
            } else {
                res.render("author_list", {title: "Author List", author_list: list_authors})
            }
    }); 
};

// Display detail page for a specific Author.
exports.author_detail = (req, res, next) => {
    const findAuthor = Author.findById(req.params.id);
    const findAuthorBooks = Book.find({author: req.params.id});

    Promise.all([findAuthor, findAuthorBooks])
        .then(results => {
            const author = results[0];
            const authorBooks = results[1];

            if (author == null) {
                const err = new Error("Author not found!");
                err.status = 404;
                return next(err);
            }

            // SUCCESS!
            res.render("author_detail", {title: "Author Detail", author: author, authorBooks: authorBooks});
        })
        .catch(err => next(err));
};

// Display Author create form on GET.
exports.author_create_get = function(req, res, next) {
    res.render("author_form", { title: "Create Author"});
};

// Handle Author create on POST.
exports.author_create_post = [
    
    // Validate input
    body("first_name").trim().isLength({min: 1}).withMessage("First name must be specified")
        .isAlphanumeric().withMessage("First name has non-alphanumeric characters"),
    body("family_name").trim().isLength({min: 1}).withMessage("Family name must be specified")
        .isAlphanumeric().withMessage("Family name has non-alphanumeric characters"),
    body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601(),
    body("date_of_death", "Invalid date of death").optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize input
    sanitizeBody("first_name").trim().escape(),
    sanitizeBody("family_name").trim().escape(),
    sanitizeBody("date_of_birth").toDate(),
    sanitizeBody("date_of_death").toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        var author = new Author(
            {
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death
            });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', { title: 'Create Author', author: author, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.

            // Create an Author object with escaped and trimmed data.
            author.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new author record.
                res.redirect(author.url);
            });
        }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {
    const author = Author.findById(req.params.id);
    const authors_books = Book.find({author: req.params.id});

    Promise.all([author, authors_books])
        .then(results => {
            const author = results[0];
            const authors_books = results[1];

            if (author == null) {
                res.redirect("/catalog/authors");
                return;
            }

            res.render("author_delete", { title: "Delete Author", author: author, authors_books: authors_books});
            return;
        }).catch(err => next(err));
};

// Handle Author delete on POST.
exports.author_delete_post = (req, res, next) => {
    const author = Author.findById(req.body.authorid);
    const authors_books = Book.find({ author: req.body.authorid });

    Promise.all([author, authors_books])
        .then(results => {
            const author = results[0];
            const authors_books = results[1];

            if (authors_books.length > 0) {
                // Author has books!
                res.render("author_delete", { title: "Delete Author", author: author, authors_books: authors_books });
                return;
            }

            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                res.redirect("/catalog/authors");
            });
        })
        .catch(err => next(err));
}

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};