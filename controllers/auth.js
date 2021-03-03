var db     = require('../db.js'),
    bcrypt = require('bcryptjs');

exports.register = function(req, res){
    var{ firstName, lastName, email, password, passwordConfirm, adminCode} = req.body;
    if(!firstName || !lastName || !email || !password || !passwordConfirm){
        req.flash("error", "Please fill the complete form to register");
        return res.redirect('/');
    }

    db.query('SELECT email FROM Users WHERE email = ?', [email], async function(err, results){
        if(err){
            console.log(err);
        }
         if (results.length > 0 && email!=''){
            req.flash("error", "A user with this email address already exist !");
            return res.redirect('/');

        }

        db.query('SELECT * FROM Users WHERE userId = 1', async function(err, results){
             if(!(await bcrypt.compare(adminCode, results[0].adminCode))){
                  var  admin = 0;
             }
              else{
                  var  admin = results[0].adminCode;
            }

        if( password !== passwordConfirm){
                req.flash("error", "Please enter same password");
                return res.redirect('/');
        }

        let hashedPassword = await bcrypt.hash(password, 8);

        db.query('INSERT INTO Users SET ?', {firstName:firstName , lastName:lastName , email:email , password:hashedPassword , adminCode:admin}, function(err, results){
            if(err){
                console.log(err);
            }
            else{
                req.flash("success", "You are Signed Up. Log in to use the wesite.");
                res.redirect('/login');
                console.log("registered");
            }
        });
     });
   });
};


exports.login = async function(req, res){
    try{

            var { email, password } = req.body;

        if( !email || !password){
            req.flash("error", "Please provide an email and password");
            return res.redirect('/login');
        }
        else{
            db.query('SELECT * FROM Users WHERE email = ?', [email], async function(err, results){

        //Check if no user of the given email id is found or if the found user has different password.
                if(results.length == 0){
                    req.flash("error", "There is no user registered with this email address !");
                    res.status(401).redirect('/login');
                }

                else{
                    if(!(await bcrypt.compare(password, results[0].password))){
                         req.flash("error", "Wrong Credentials");
                         res.status(401).redirect('/login');
                    }
                    else {
                    console.log(results);
                    req.session.user = results;
                    req.flash("success","Welcome to your profile "+ results[0].firstName)
                    res.redirect('/users/home');
                   }
                }
            });
        }
    }
    catch(err){
        console.log(err);
    }

};

exports.logout = async function(req, res,next){
    delete req.session.user;
    next();
}