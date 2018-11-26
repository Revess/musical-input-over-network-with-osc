const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const os = require('os');
const ifaces = os.networkInterfaces();
const osc = require('node-osc');

//Objects
var clients = {};
var oscServer = [];
var oscClient = [];
var oscSend = [];
var port = [];
var matches = [];

var ipAddress = '';
var oscPort = 8000;
var sendArray = [];
var averageAmmount = 0;
var parameters = [param('/hatvol'), 
                  param('/kickvol'),
                  param('/snarevol'),
                  param('/pluckvol'),
                  param('/bassvol'),
                  param('/chordvol'),
                  param('/distortion'),
                  param('/algo'),
                  param('/x'),
                  param('/y'),
                  param('/BPM')
                  ];

//Functions
function average(array, amount) {
    var sum = 0;
    for(var i = 0; i < amount; i++) {
        sum += parseFloat(array[i]);
    }
    return (sum/amount);
}

function param(name) {
    return ([name, [], 0]);
}

/*----------------------
=========SERVER=========
----------------------*/
//Server.io dependencies
Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
      } else {
        // this interface has only one ipv4 adress
        if(ifname == 'Ethernet 6' || ifname == 'WiFi'){
          ipAddress = ipAddress.concat(String(iface.address));
        }
      }
      ++alias;
    });
  });

http.listen(8001, function(){
    console.log('listening on ' + ipAddress + ':8001');
});

app.use(express.static(path.join(__dirname, 'client')));

io.sockets.setMaxListeners(0);

//To run the server
io.on('connection', function(socket){
    clients[socket.id] = socket;

    socket.on('checkconnection',function(data){
        oscSend[data] = clients[data];
        oscSend[data].emit("connected",data);
        averageAmmount+=1;
    });

    socket.on('startClientOSC',function(data){
        oscClient[data] = new osc.Client(ipAddress,oscPort);
    });

    socket.on('disconnect', function(reason){
        delete clients[socket.id];
        averageAmmount-=1;
    });
    
    //get the userinput data
    socket.on('data', function(data) {
        var dataArray = [];
        dataArray.push(data.address);
        dataArray.push(data.data);
        sendArray.push(dataArray);
        //Data sorter based on the send address
        sendArray.forEach(function(data) {
            parameters.forEach(function(para) {
                if(data[0] == para[0]) {
                    para[1].push(data[1]);
                    sendArray.splice(sendArray[sendArray.indexOf(data)], 1);
                }
            });
        });
        //Data divider to the right parameter array's
        parameters.forEach(function(para) {
            if(para[1].length >= averageAmmount) {
                para[2] = average(para[1], averageAmmount);
                para[1] = [];
            }
            //Send the different data to the program
            if(oscClient[data.id]) {
                oscClient[data.id].send(para[0], para[2], function() {});
            }
        });
    });

    //On killing the process
    process.on('SIGINT',function(){
        for (var i in oscServer) {
            if (oscServer[i]) {
              oscServer[i].kill();  
            }
        }
        for (var i in oscClient) {
            if (oscClient[i]) {
              oscClient[i].kill();  
            }
        }
        for (var i in oscSend) {
            oscSend[i].disconnect();
        }
        for (var i in port) {
            port[i].close();
        }  
        socket.disconnect(true);
        process.exit (0);
    });
});