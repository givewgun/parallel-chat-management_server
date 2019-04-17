const cors = require('cors');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mysql = require('mysql');
const config = require('./config/dbconnect');
const path = require('path');
const moment = require('moment');

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: config.database.user,
  password: config.database.password,
  database: 'parallel_db'
})

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "../client/page.html"));
});

let port = parseInt(process.argv[2])
http.listen(port, function (err) {
  if (err) throw err
  console.log('listening on port ' + port)
})

io.on('connection', function (socket) {


  socket.on('createGroup', function (data, callback) {
    console.log("Creating group " + data.groupName);
    let query1 = 'SELECT * FROM group_ WHERE groupname=?';
    connection.query(query1, [data.groupName], (error, result) => {
      if (error) throw error
      //console.log(result);
      if (result.length == 0) {
        let query2 = 'INSERT INTO group_(groupname) values(?)';
        connection.query(query2, [data.groupName], (error, result) => {
          if (error) throw error
          //console.log(result);
          callback({ status: "SUCCESS", result: result });
          console.log('create group success!!!');
        });
      } else {
        callback({ status: "SUCCESS", result: result });
        console.log('group already existed!!!');
      }


    });

  })

  socket.on('login', function (data, callback) {
    console.log("Logging in " + data.userName);
    let query1 = "SELECT * FROM user_ WHERE username=?";

    connection.query(query1, [data.userName], (error, result) => {
      if (error) throw error
      //console.log(result);
      if (result.length == 0) {
        let query2 = 'INSERT INTO user_(username) values(?)';
        connection.query(query2, [data.userName], (error, result) => {
          if (error) throw error
          //console.log(result);
          callback({ status: "SUCCESS", result: result });
          console.log('Login success!!!');
        });
      } else {
        callback({ status: "SUCCESS", result: result });
        console.log('User already exist and login success!!!');
      }
    });
  })

  socket.on('joinGroup', function (data, callback) {
    console.log("Joining group " + data.userName + " " + data.groupName);
    let query = 'INSERT INTO join_(username,groupname,last_read) values(?,?,-1)';
    var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let query2= 'INSERT INTO message(content, time_stamp, username, groupname,type_) VALUES (?,?,?,?,0)'
    connection.query(query, [data.userName, data.groupName], (error, result) => {
      if (error) throw error
      //console.log(result);
      let message="User "+data.userName+" has joined the group.";
      connection.query(query2, [message, mysqlTimestamp, data.userName, data.groupName], function (err, result) {
        if (err) throw err
        //console.log(result);
      })
      socket.join(data.groupName);
      callback({ status: "SUCCESS", result: result });
      console.log('Join group success!!!');
    });
  })

  socket.on('leaveGroup', function (data, callback) {
    console.log("Leaving group " + data.userName + " " + data.groupName);
    let query = 'DELETE FROM join_ WHERE username=? and groupname=?';
    var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let query2= 'INSERT INTO message(content, time_stamp, username, groupname,type_) VALUES (?,?,?,?,0)'

    connection.query(query, [data.userName, data.groupName], (error, result) => {
      if (error) throw error
      //console.log(result);

      let message="User "+data.userName+" has left the group.";
      connection.query(query2, [message, mysqlTimestamp, data.userName, data.groupName], function (err, result) {
        if (err) throw err
        //console.log(result);
      })

      socket.leave(data.groupName);
      callback({ status: "SUCCESS", result: result });
      console.log('Leave group success!!!');
    });
  })

  socket.on('getAllGroup', function (data, callback) {
    //console.log("Getting all groups ");
    let query = 'select * from group_';

    connection.query(query, [], (error, result) => {
      if (error) throw error
      //console.log(result);
      callback({ status: "SUCCESS", result: result });
      //console.log('get all group success!!!');
    });
  })

  socket.on('getJoinedGroup', function (data, callback) {
    //console.log("Getting joined groups " + data.userName);
    let query = 'select join_.groupname from join_ where username=?';

    connection.query(query, [data.userName], (error, result) => {
      if (error) throw error
      //console.log(result);
      callback({ status: "SUCCESS", result: result });
      //console.log('get joined group success!!!');
    });
  })

  socket.on('sendMessage', function (msg, callback) {
    console.log("Sending message "+msg.message+" "+msg.userName+" "+msg.groupName);

    // get time
    var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    //inset to table 
    let query = 'INSERT INTO message(content, time_stamp, username, groupname,type_) VALUES (?,?,?,?,1)'

    connection.query(query, [msg.message, mysqlTimestamp, msg.userName, msg.groupName], function (err, result) {
      if (err) throw err
      //if inserted then ok
      //console.log(result);
      callback({ status: "SUCCESS", result: result });
      console.log('send message success!!!');
    })


  })

  socket.on('getGroupChat', function (data, callback) {
    //console.log("Getting group chat" + data.groupName + " " + data.ack);
    let query = 'select * from message where msg_ID>? and groupname=?';

    connection.query(query, [data.ack, data.groupName], (error, result) => {
      if (error) throw error
      //console.log(result);
      callback({ status: "SUCCESS", result: result });
      //console.log('Get group chat success!!!');
    });
  })

  socket.on('getReadChat', function (data, callback) {
    //console.log("Getting read chat" + data.userName);
    let query = 'select * from join_ where username=?';

    connection.query(query, [data.userName], (error, result) => {
      if (error) throw error
      //console.log(result);
      callback({ status: "SUCCESS", result: result });
      //console.log('Get read chat success!!!');
    });
  })

  socket.on('setReadChat', function (data, callback) {
    //console.log("Setting read chat" + data.msgID + " " + data.userName + " " + data.groupName);
    let query = 'update join_ set last_read=? where username=? and groupname=?';

    connection.query(query, [data.msgID, data.userName, data.groupName], (error, result) => {
      if (error) throw error
      //console.log(result);
      callback({ status: "SUCCESS", result: result });
      //console.log('Set read chat success!!!');
    });
  })

  socket.on('disconnect', function () {
    console.log('client disconnect...', socket.id)
  })

  socket.on('error', function (err) {
    console.log('received error from client:', socket.id)
    console.log(err)
  })
})

