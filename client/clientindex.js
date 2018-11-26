//Objects
var socket = io();
var clientID;
var sliders =   [document.getElementById('/hatvol'),
                document.getElementById('/kickvol'),
                document.getElementById('/snarevol'),
                document.getElementById('/pluckvol'),
                document.getElementById('/bassvol'),
                document.getElementById('/chordvol')
            ];
var divsToHide =[document.getElementsByClassName('allSliders'),
                document.getElementsByClassName('allDials'),
                document.getElementsByClassName('padcontainer')
            ];

//Functions
function oscSend(name, value) {
    var sendData = {'address':name,'data':value,'id':clientID};
    socket.emit('data', sendData)
}

/*----------------------
=========CLIENT=========
----------------------*/
//Recieving slider data from HTML and sending it out
sliders[0].oninput = function() {
    oscSend(sliders[0].id,sliders[0].value);
}

sliders[1].oninput = function() {
    oscSend(sliders[1].id,sliders[1].value);
}

sliders[2].oninput = function() {
    oscSend(sliders[2].id,sliders[2].value);
}

sliders[3].oninput = function() {
    oscSend(sliders[3].id,sliders[3].value);
}

sliders[4].oninput = function() {
    oscSend(sliders[4].id,sliders[4].value);
}

sliders[5].oninput = function() {
    oscSend(sliders[5].id,sliders[5].value);
}

//Establishing a connection with the server and the osc server
socket.on('connect',function() {
    clientID = socket.io.engine.id;
    socket.emit('checkconnection',clientID);
});

socket.on('connected',function(data){
    socket.emit('startClientOSC',clientID);
});

socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
        document.getElementById("message_user").innerHTML = "Server disconnected";
        socket.close();
    }
    divsToHide.forEach(function(div){
        div[0].style.display = "none";
    });
});

socket.on('reconnect_attempt', (attemptNumber) => {
    if (attemptNumber >= 10) {
        socket.close();
    }
});

//jQuery code to run the dial and XY pad
$(function() {
    var $all = $(".dial, .pad")
        , $body = $("body");

    var $pad = $(".pad")    
    .xy({
        displayPrevious:false
        , min : -100
        , max : 100
        , fgColor:"#ff4500"
        , bgColor:"#d2d2d2"
        , change : function (value) {
            oscSend('/x',value[0]);
            oscSend('/y',value[1]);
        }
    })
    .css({'border':'5px solid #BBB'});

    $(".distortion")
    .dial({
        fgColor:"#ff4500"
        , bgColor:"#d2d2d2"
        , thickness : .3
        , change : function (value) {
            oscSend('/distortion',value);
        }
    })

    $(".algo")
    .dial({
        fgColor:"#ff4500"
        , bgColor:"#d2d2d2"
        , thickness : .3
        , change : function (value) {
            oscSend('/algo',value);
        }
    })

    $(".BPM")
    .dial({
        fgColor:"#ff4500"
        , bgColor:"#d2d2d2"
        , thickness : .3
        , change : function (value) {
            oscSend('/BPM',value);
        }
    })

    $('#cursor').bind(
        'change'
        , function(e) {
            $all.trigger("configure", {cursor:parseInt($(this).find('option:selected').val())});
        }
    );

    $(".height").bind(
        'click'
        , function(e) {
            $all.trigger("configure", {height:100});
        }
    );
});