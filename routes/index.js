var express = require('express');
var router = express.Router();
var db  = require('../db.js');
var authController = require('../controllers/auth');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.session);
  res.render('signup',{user:req.session.user});
});

router.post('/register', authController.register );

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login Page', user:req.session.user});
});

router.post('/login', authController.login);

const CLIENT_ID = '959039765263-q79iedk895c7gr6avr6q0k4f0d9qtrcp.apps.googleusercontent.com';
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

router.post('/tokensignin', async function(req, res, next) {

  try {
    const ticket = await client.verifyIdToken({
        idToken: req.body.idtoken,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    //const userid = payload['sub'];
    const email = payload['email'];
    const name  = payload['name'];
    var string = name.split(' ');
    var firstName = string[0];
    var lastName = string[1];
    // console.log(userid+" "+email);
    // console.log(payload);
    // console.log(firstName);
     db.query("SELECT * FROM Users WHERE email = ? ",[email],function(err, results){
       console.log(results);
       console.log(results.length);
        if( results.length == 0){
          db.query("INSERT INTO Users SET ?", {firstName:firstName, lastName:lastName, email:email, adminCode: 0});
            db.query("SELECT * FROM Users WHERE email = ?", [email], function(err, results){
              req.session.user = results;
              req.flash("success","You are signed up. Welcome to your profile "+ firstName)
              res.sendStatus(200);
            });
          }
        else{
          req.flash("success","Welcome to your profile "+ results[0].firstName)
          req.session.user = results;
          res.sendStatus(200);
        }
    });
  }
  catch {
    req.flash("error","Not authorised to login");
    res.sendStatus(401);
  }
});

router.get('/logout', authController.logout, function(req, res){
  res.sendStatus(200);
});

module.exports = router;


