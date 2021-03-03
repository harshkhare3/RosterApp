var mysql = require('mysql');

var db= mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Project'
});

db.connect(function(error){
    if(error){
        console.log("Please Connect to MYSQL before proceeding !");
    }
    else{
        console.log("MYSQL Connected");
    }
});

module.exports = db;