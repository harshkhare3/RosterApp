var express = require('express');
var router = express.Router();
var db  = require('../db.js');
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var multer  = require('multer');
var bcrypt = require('bcryptjs');
var upload = multer({ dest: 'public/images/uploads/' });

router.use(function(req, res, next) {
if(!('user' in req.session)){
    req.flash("error","You must Login first!");
    res.redirect('/login');
    return;
  }

  next();

});

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    proxy: 'http://wdcmail.hopto.org',
    auth: {
        user: 'wdcproj2020@gmail.com',
        pass: process.env.PASS
    }
});

router.get('/', function(req, res){
    db.query("SELECT * FROM Users WHERE adminCode = '0' ",function(err, results){
        res.send(results);
    });
});

router.get('/home', function(req, res){
      res.render('home',{user:req.session.user});
});

router.get('/:id' , function(req, res) {
    db.query('SELECT * FROM Users WHERE userId = ? ',[req.params.id], function(err, results){
           res.render('profile' , {user:req.session.user , currentUser : results});
      });
});

router.put('/:id/update', function(req, res){
    var{ firstName, lastName, email, bio, admin } = req.body;

    if (admin == ''){
       db.query('UPDATE Users SET firstName=?, lastName=?, email=?, bio=? WHERE userId=?',[firstName, lastName, email, bio, req.params.id]);
       req.flash("success", "User details updated successfully !");
       res.sendStatus(200);
    }

    else{
      db.query('SELECT * FROM Users WHERE userId = 1', async function(err, results){
             if(!(await bcrypt.compare(admin, results[0].adminCode))){
                 var a = 0;
                 db.query('UPDATE Users SET firstName=?, lastName=?, email=?, bio=?, adminCode=? WHERE userId=?',[firstName, lastName, email, bio, a, req.params.id]);
                 req.flash("erroe", "Admin code not updated as it is not valid !");
                 res.sendStatus(200);
             }
              else{
                 var a = results[0].adminCode;
                 db.query('UPDATE Users SET firstName=?, lastName=?, email=?, bio=?, adminCode=? WHERE userId=?',[firstName, lastName, email, bio, a, req.params.id]);
                 req.flash('success', "Congratulations, you are an Admin now! Logout and login once again to access the Manager's Role.");
                 res.sendStatus(200);
              }
      });
    }
});

router.post('/:id/notification', function(req, res){
    var email = req.body.email;

    db.query('SELECT shifts.Monday, shifts.Tuesday, shifts.Wednesday, shifts.Thursday, shifts.Friday, Users.firstName, Users.lastName  FROM shifts INNER JOIN Users ON shifts.id = Users.userId WHERE Users.userId=?',[req.params.id], function(err, results){
      var text ="Monday - "+ results[0].Monday + '<br>' + "Tuesday -" + results[0].Tuesday + '<br>' + "Wednesday -" + results[0].Wednesday + '<br>' +
      "Thursday -" + results[0].Thursday + '<br>'+ "Firday -" +results[0].Friday + '<br>';
      var name = results[0].firstName + ' ' + results[0].lastName;
      var mailOptions = {
      from: 'wdcproj2020@gmail.com', // sender address
      to: email, // list of receivers
      subject: "Shifts for "+ name, // Subject line
      html:"Hey " + name + ", here are your shift for the coming week" + '<br>' + text + '<br>' + "Kind Regards" + '<br>' + 'Manager' // plain text body
      };

     transporter.sendMail(mailOptions, function(err, response){
        if(err){
           req.flash("error", err.message);
           res.sendStatus(400);
        }else{
           req.flash("success", "Email notification sent successfully!");
           res.sendStatus(200);
        }
     });
    });
});

router.get('/:id/ava', function(req, res){
    if(req.params.id == req.session.user[0].userId){
       res.render('availability', {user:req.session.user});
    }
    else{
       req.flash("error","You can only access your own Availability Page !");
       res.redirect("back");
    }
});

router.get('/:id/availability', function(req, res){
        db.query('SELECT * FROM availability WHERE id = ?',[req.params.id], function(err, results){
        res.send(results);
    });
});

router.post('/:id/availability', function(req, res){
    if(req.params.id == req.session.user[0].userId){
       var{ mon, tue, wed, thu, fri, task1, task2, task3} = req.body;
       var id = req.session.user[0].userId;
       db.query('SELECT id FROM availability WHERE id = ?', id , function(err, results){
         if(results.length == 0){
            db.query('INSERT INTO availability SET ?',{id:id , mon:mon, tue:tue, wed:wed, thu:thu, fri:fri, task1:task1, task2:task2, task3:task3});
          }
         else{
            db.query('UPDATE availability SET mon=?,tue=?,wed=?,thu=?,fri=?,task1=?,task2=?,task3=? WHERE id=?',[mon, tue, wed, thu, fri, task1, task2, task3, id]);
        }
     });
      req.flash("success","Successfully updated your Availability !");
      res.sendStatus(200);
    }

    else{
      req.flash("error","You are not allowed to do this !");
      res.sendStatus(400).redirect('/users/home');
    }
});

router.get('/:id/manager/assign', function(req, res){
   if(req.session.user[0].adminCode == process.env.ADMIN){
      res.render('assigntask', {user:req.session.user});
   }
   else{
      req.flash("error","You are not allowed to access this page!");
      res.redirect("/users/home");
   }
});

router.get('/:id/shifts', function(req, res){
    db.query('SELECT * FROM shifts WHERE id = ?',[req.params.id], function(err, results){
        res.send(results);
    });
});

router.post('/:id/shifts', function(req,res){
  if(req.session.user[0].adminCode == process.env.ADMIN){
    var{ id, day, duty} = req.body;
    if( !id || !day || !duty){
        req.flash("error","Please fill all the fields to add a shift!");
        res.sendStatus(400);
    }
    else{
        db.query('SELECT id FROM shifts WHERE id = ?', [req.body.id], function(err, results){
        if(err){
            req.flash("error","Error in adding the shift.");
            res.sendStatus(400);
        }
        else if(results.length == 0){
           if( day == "Monday"){
                  db.query('INSERT INTO shifts SET ?',{id:id , Monday:duty});
           }

           else if( day == "Tuesday"){
                  db.query('INSERT INTO shifts SET ?',{id:id , Tuesday:duty});
           }

           else if( day == "Wednesday"){
                  db.query('INSERT INTO shifts SET ?',{id:id , Wednesday:duty});
           }

           else if( day == "Thursday"){
                  db.query('INSERT INTO shifts SET ?',{id:id , Thursday:duty});
           }
           else if( day == "Friday"){
                  db.query('INSERT INTO shifts SET ?',{id:id , Friday:duty});
           }
            db.query('SELECT * FROM Users WHERE userId = ?', [req.params.id], function(err, results){
                req.flash("success", "Shift added successfully for "+ results[0].firstName + ' ' + results[0].lastName + '!');
                res.sendStatus(200);
            });
        }
        else{
            if( day=="Monday"){
                db.query('UPDATE shifts SET Monday=? WHERE id=?',[duty,id]);
            }
            else if( day=="Tuesday"){
                db.query('UPDATE shifts SET Tuesday=? WHERE id=?',[duty,id]);
            }
            else if( day=="Wednesday"){
                db.query('UPDATE shifts SET Wednesday=? WHERE id=?',[duty,id]);
            }
            else if( day=="Thursday"){
                db.query('UPDATE shifts SET Thursday=? WHERE id=?',[duty,id]);
            }
            else if( day=="Friday"){
                db.query('UPDATE shifts SET Friday=? WHERE id=?',[duty,id]);
            }
            db.query('SELECT * FROM Users WHERE userId = ?', [req.params.id], function(err, results){
                req.flash("success", "Shift added successfully for "+ results[0].firstName + ' ' + results[0].lastName + '!');
                res.sendStatus(200);
            });
        }
    });
    }

  }
  else{
      req.flash("error","You are not allowed to access this page!");
      res.redirect("/users/home");
  }
});

router.get('/:id/allshifts', function(req, res){
    db.query('SELECT shifts.id, shifts.Monday, shifts.Tuesday, shifts.Wednesday, shifts.Thursday, shifts.Friday, Users.firstName, Users.lastName  FROM shifts INNER JOIN Users ON shifts.id = Users.userId WHERE Users.adminCode = "0"' , function(err, results){
         res.send(results);
      });
});

router.get('/:id/remind', function(req, res){
    db.query('SELECT * FROM Users WHERE userId=?',[req.params.id], function(err, results){
        res.send(results);
    });
});

router.post('/:id/remind', function(req, res){
    db.query('UPDATE Users SET adminnotice=? WHERE userId=?',[req.body.remind , req.params.id]);
           req.flash("success", "Reminders added Successfully!");
           res.sendStatus(200);
});

router.get('/:id/notice', function(req, res){
    db.query('SELECT posts.id, posts.userId, posts.post, Users.firstName, Users.lastName FROM posts INNER JOIN Users ON Users.userId = posts.userId', function(err, results){
        res.send(results);
    });
});

router.post('/:id/notice', function(req, res){
    db.query('INSERT INTO posts SET ?',{ userId : req.params.id , post : req.body.notice });
           req.flash("success", "Public Notice added successfully!");
           res.sendStatus(200);

});

router.put("/:id/notice/edit", function(req, res){
 if(req.session.user[0].adminCode == process.env.ADMIN){
    db.query('SELECT COUNT(id) AS ids FROM posts', function(err, results){
        var { notice, id } = req.body;
        db.query('UPDATE posts SET post=? WHERE id=?',[notice, id]);
        req.flash("success", "Successfully edited the post!");
        res.sendStatus(200);
    });
  }
  else{
      req.flash("error", "Access denied !");
      res.redirect('/login')
  }

});

router.get("/:id/completetask", function(req, res){
     if(req.session.user[0].adminCode == process.env.ADMIN){
      res.render('complete', {user:req.session.user});
   }
   else{
      req.flash("error","You are not allowed to access this page!");
      res.redirect("/users/home");
   }
});

router.get("/:id/complete", function(req, res){
    db.query('SELECT Users.firstName, Users.lastName, complete.id, complete.day, complete.shift FROM complete INNER JOIN Users ON Users.userId = complete.id', function(err, results){
        res.send(results);
    });
});

router.post("/:id/complete", function(req, res){
    // console.log(req.body);
    var day = req.body.day;
    var task = null;

    if(day == "Monday"){
      db.query('SELECT * FROM shifts WHERE id=?',[req.params.id], function(err, results){
          var task = results[0].Monday;
          db.query('INSERT INTO complete SET ?', {id:req.params.id, day:"Monday", shift:task});
      });
      db.query('UPDATE shifts SET ? WHERE id=?',[{Monday:task},req.params.id]);
    }

     else if(day == "Tuesday"){
      db.query('SELECT * FROM shifts WHERE id=?',[req.params.id], function(err, results){
          var task = results[0].Tuesday;
          db.query('INSERT INTO complete SET ?', {id:req.params.id, day:"Tuesday", shift:task});
      });
      db.query('UPDATE shifts SET ? WHERE id=?',[{Tuesday:task},req.params.id]);
    }

     else if(day == "Wednesday"){
      db.query('SELECT * FROM shifts WHERE id=?',[req.params.id], function(err, results){
          var task = results[0].Wednesday;
          db.query('INSERT INTO complete SET ?', {id:req.params.id, day:"Wednesday", shift:task});
      });
      db.query('UPDATE shifts SET ? WHERE id=?',[{Wednesday:task},req.params.id]);
    }

     else if(day == "Thursday"){
      db.query('SELECT * FROM shifts WHERE id=?',[req.params.id], function(err, results){
          var task = results[0].Thursday;
          db.query('INSERT INTO complete SET ?', {id:req.params.id, day:"Thursday", shift:task});
      });
      db.query('UPDATE shifts SET ? WHERE id=?',[{Thursday:task},req.params.id]);
    }

     else if(day == "Friday"){
      db.query('SELECT * FROM shifts WHERE id=?',[req.params.id], function(err, results){
          var task = results[0].Friday;
          db.query('INSERT INTO complete SET ?', {id:req.params.id, day:"Friday", shift:task});
      });
      db.query('UPDATE shifts SET ? WHERE id=?',[{Friday:task},req.params.id]);
    }

    req.flash("success", "Congratulations on completing the task!");
    res.sendStatus(200);
})

router.delete("/:id/deletetask", function(req, res){
    db.query('DELETE FROM complete WHERE id=? AND day=?', [req.params.id, req.body.day]);
    req.flash("Completed task removed from the database successfully!");
    res.sendStatus(200);
});

router.delete("/:id/notice/delete", function(req, res){
  if(req.session.user[0].adminCode == process.env.ADMIN){
    db.query('SELECT COUNT(id) AS ids FROM posts', function(err, results){
        var { id } = req.body;
        db.query('DELETE FROM posts WHERE id=?',[id]);
        req.flash("success", "Successfully Deleted the post!");
        res.sendStatus(200);
    });
  }
  else{
      req.flash("error", "Access denied !");
      res.redirect('/login');
  }
});

module.exports = router;