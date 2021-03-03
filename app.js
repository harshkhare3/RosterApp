require('dotenv').config();
var express       = require('express'),
    path          = require('path'),
    cookieParser  = require('cookie-parser'),
    logger        = require('morgan'),
    flash         = require("connect-flash"),
    app           = express();
    // fileUpload    = require('express-fileupload');


//Routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
// app.use(fileUpload());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require("express-session")({
	secret: "My roster Website",
	resave: false,
	saveUninitialized: false
}));

app.use(function(req, res, next){
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);


module.exports = app;
