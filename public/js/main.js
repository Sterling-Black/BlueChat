const convers = document.querySelector(".conversation");

//declaring orginal chats here so that the id's can be maintained
let originalChats = document.querySelector(".chatts").innerHTML;
const inputMsg = document.querySelector(".type-msg");
const send = document.querySelector(".send-box");
const media = document.querySelector(".media");

const messages = [], downloads = [], oopMessage=[], emails=[], avatarsUrl=[], typingTimer=[];
const chats = [], BA = [], draft=[], chatStatus=[], paths=[], lastMsgs = [];
let sending = false, receiving=false, downloading=false, uploading=false;



/*==================== DARK LIGHT THEME ====================*/
const themeButton = document.getElementById("theme-button");
const darkTheme = "dark-theme";
const iconTheme = "uil-sun";


// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () =>
    document.body.classList.contains(darkTheme) ? "dark" : "light";
const getCurrentIcon = () =>
    themeButton.classList.contains(iconTheme) ? "uil-moon" : "uil-sun";

// We validate if the user previously chose a topic
if (selectedTheme) {
    // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark
    document.body.classList[selectedTheme === "dark" ? "add" : "remove"](
        darkTheme
    );
    
    if(document.body.classList&&document.body.classList.contains(darkTheme)){
        console.log("dark");
        convers.style.backgroundImage = 'url("image/BG.jpg")';
    }else{
        console.log("light");
        convers.style.backgroundImage = 'url("image/BG2.webp")';
    }

    themeButton.classList[selectedIcon === "uil-moon" ? "add" : "remove"](
        iconTheme
    );
}

// Activate / deactivate the theme manually with the button
themeButton.addEventListener("click", () => {
    // Add or remove the dark / icon theme
    document.body.classList.toggle(darkTheme);
    themeButton.classList.toggle(iconTheme);

    

    if(document.body.classList&&document.body.classList.contains(darkTheme)){
        console.log("dark");
        convers.style.backgroundImage = 'url("image/BG.jpg")';
    }else{
        console.log("light");
        convers.style.backgroundImage = 'url("image/BG2.webp")';
    }

    // We save the theme and the current icon that the user chose
    localStorage.setItem("selected-theme", getCurrentTheme());
    localStorage.setItem("selected-icon", getCurrentIcon());
});


// When searching for a chat
const chatSearch = document.querySelector(".chat-search");
const names = document.querySelectorAll(".chat-values .name");
const chatList = document.querySelector(".chatts");

const empty = document.createElement("div");
empty.innerHTML="Chat not found";
empty.classList.add("empty");

let compares = 0;
chatSearch.addEventListener("keyup",(e)=>{
    const showNames = [];
    if(chatSearch.value){
        const newValue = chatSearch.value.toUpperCase();
        socket.emit("search",newValue,id);

        names.forEach(name=>{
            // capitalize to facilitate comparism
            const srch = chatSearch.value.toUpperCase();
            const nm = name.textContent.toUpperCase();

            // comprism
            console.log(name.parentNode.parentNode.parentNode);
            if(nm.includes(srch)){
                showNames.push(name.parentNode.parentNode.parentNode);//add the 3rd parent element (list-item)
            }

            // increments after every comparism
            compares++;
        })

        //if it has finished comparing
        if(compares>=chats.length){
            chatList.innerHTML = "";
            showNames.forEach(showName=>{
                if(showName){
                    chatList.appendChild(showName);
                    showName.addEventListener("click", show);
                }

            })
            if(!chatList.innerHTML){
                chatList.appendChild(empty);
            }
        }

    //if search bar is empty
    }else{
        chatList.innerHTML = originalChats;
        chatList.childNodes.forEach(listItem=>{
            listItem.addEventListener("click", show);
            console.log(listItem.firstChild);
        });
    }
    document.querySelectorAll(".chat-img").forEach((chatImg)=>{
        chatImg.addEventListener("click",showModal);
    })
});


socket.on("recieved-users",(chats)=>{

    // console.log(chats)

    if(chats!=[]){
        
        chatList.appendChild(empty);
        
        chats.forEach((chat, index)=>{
            if(index==0){
                chatList.innerHTML = "";
            }

            let name;
            if(chat.name){
                name = chat.name;
            }else{
                name = chat.username.split("@")[0];
            }

            // console.log(name);

            const username = chat.username;

            const chatID = chat._id;
            
            const newChat = document.createElement("li");

            chatList.appendChild(newChat);

            const src = avatarsUrl[chatID]?avatarsUrl[chatID]:"image/user.png"
            newChat.outerHTML = `<li class="list-item" id="${chatID}">
                                    <img class="chat-img" src="${src}" alt="">
                                    <div class="chat-values">
                                        <p><span class="name">${name}</span> <span class="time right"></span></p>
                                        <p><span class="last-msg">${username}</span> <span class="num right"></span></p>
                                    </div>
                                </li>`;
    
            chatList.childNodes.forEach(listItem=>{
                listItem.addEventListener("click", show);
                // console.log(listItem.firstChild);
            });
            document.querySelectorAll(".chat-img").forEach((chatImg)=>{
                chatImg.addEventListener("click",showModal);
            })
    
        });
    }


});



//when the search bar is cleared
chatSearch.addEventListener("search",(e)=>{
    chatList.innerHTML = originalChats;
    chatList.childNodes.forEach(listItem=>{
        listItem.addEventListener("click", show);
        console.log(listItem.firstChild);
    });
    document.querySelectorAll(".chat-img").forEach((chatImg)=>{
        chatImg.addEventListener("click",showModal);
    })
});


//When a chat is selected
const back = document.getElementsByClassName("back-chat");
let childClick = false;
const minSize = 830;

//Function that shows thechat container
function show(e){


    convers.scrollTop = convers.scrollHeight;

    const chat = e.target.closest(".list-item");
    const index = chat.id;
    const chatConvers = messages[index];
    const src = chat.querySelector(".chat-img").src;
    
    // console.log(index)
    
    
    let chatDraft;
    
    // console.log(draft[index])
    
    if(draft[index]){
        chatDraft = draft[index];
    }else{
        chatDraft = "";
    }

    socket.emit("chat-status",index);

    let chatLastSeen;

    if(chatStatus[index]){
        chatLastSeen = chatStatus[index];
    }else{
        chatLastSeen = "";
    }

    // console.log(index)
    
    draft[convers.id] = inputMsg.value;
    
    const nm = chat.querySelector(".name").textContent;
    
    console.log(nm,index);

    if(!e.target.classList.contains("chat-img")){

        // CHANGE NAME OF CHAT
        document.querySelector(".chat-container .prof-name").textContent = nm;

        if(typingTimer[index]&&typingTimer[index].timing){
            document.querySelector(".last-seen").classList.add("typing");
            document.querySelector(".last-seen").textContent = "typing...";
        }else{
            document.querySelector(".last-seen").textContent = chatLastSeen;
            document.querySelector(".last-seen").classList.remove("typing");
        }


        document.querySelector(".audio h3").textContent = nm;

        document.querySelector(".chat-container .chat-img").src = src;


        // CHANGE THE WHOLE CONVERSATION
        if(chatConvers)
        convers.innerHTML = chatConvers;
        else
        convers.innerHTML = "";


        if(convers.innerHTML){
            const audMsgs = convers.querySelectorAll(".audio-msg");
            const downloads = convers.querySelectorAll(".file.download");

            audMsgs.forEach(newAudioMsg=>{

                const index = newAudioMsg.id;
                const audioD = audio[index];
                
                const audioPlay = newAudioMsg.querySelector(".player");
                const playBar = newAudioMsg.querySelector(".bar");
                const fillBar = newAudioMsg.querySelector(".fill");
                const hold = newAudioMsg.querySelector(".hold");
                const audioLth = newAudioMsg.querySelector(".audio-lth");
                const i = audioPlay.querySelector("i");
            
                // audioD.src = audioUrl;
            
                // newAudioMsg.setAttribute("src",audioUrl);
                
                let dragP = false;
                
                playBar.addEventListener('mousedown', (event) => {
            
                    if(!dragP){
                        var rect = playBar.getBoundingClientRect(); 
                        var x = event.clientX - rect.left; 
                
                        var wS = window.getComputedStyle(playBar).width;
                        var w = wS.split("p")[0];
                        
                        const pos = (x/w)*100;
                        // console.log("Cursor position: " + (pos));
                
                        //Get spesific audio object
                        const id = (playBar.parentElement.parentElement.parentElement.id);
                        const audioID = audio[id];
                
                        audioID.currentTime = (pos*audioID.duration)/100;
            
                    }
                    
                    
                });
            
                hold.addEventListener(
                    'mouseup', () => dragP = false);
                    
                hold.addEventListener(
                    'mousedown', () => dragP = true);
            
                hold.addEventListener(
                    'mouseleave', () => dragP = false);
                
                
                hold.addEventListener(
                    'mouseenter', () => dragP = false);
                
                hold.addEventListener('mousemove', (event) => {
                    if(dragP){
            
                        var rect = hold.parentElement.getBoundingClientRect(); 
                        var x = event.clientX - rect.left; 
                
                        var wS = window.getComputedStyle(hold.parentElement).width;
                        var w = wS.split("p")[0];
                        
                        const pos = (x/w)*100;
                        // console.log("Cursor position: " + (pos));
                
                        //Get spesific audio object
                        const id = (hold.parentElement.parentElement.parentElement.parentElement.id);
                        const audioID = audio[id];
                
                        audioID.currentTime = (pos*audioID.duration)/100;
                    }
                })
            
                var getDuration = function (_player,next) {
                    _player.addEventListener("durationchange", function (e) {
                        if (this.duration!=Infinity) {
                           var duration = this.duration
                           _player.remove();
                           next(duration);
                        };
                    }, false);    
                    _player.load();
                    _player.currentTime = 24*60*60; //fake big time
                    _player.volume = 0;
                    _player.play();
                    //waiting...
                };
                
                getDuration (audioD, function (duration) {
                    console.log(duration);
                });
                
                i.addEventListener("click",()=>{
                    const id = (i.parentElement.parentElement.parentElement.id);
                    const audioID = audio[id];
            
                    if(i.classList.contains("fa-play")){
                        i.classList.remove("fa-play");
                        i.classList.add("fa-pause");
                        audioID.volume = 1;
                        audioID.play();
                    }else{
                        i.classList.add("fa-play");
                        i.classList.remove("fa-pause");
                        audioID.pause();
                    }
                })
                audioD.addEventListener("timeupdate",()=>{
                    const position = audioD.currentTime / audioD.duration;
                    fillBar.style.width = position * 100 + "%";
            
                    //get current audio time
                    const time = Math.floor(audioD.currentTime);
                    
                    audioLth.innerHTML = getTime(time);
            
                });
            
                audioD.addEventListener("ended",()=>{
                    fillBar.style.width = 0;
                    i.classList.add("fa-play");
                    i.classList.remove("fa-pause");
            
                    //get audio duration time
                    const time = Math.floor(audioD.duration);
            
                    audioLth.innerHTML = getTime(time);
                });             
                
            })
            downloads.forEach(download=>{
                eventDownload(download.parentElement);
            })
        }


        // CHANGE CONVERSATION ID
        convers.id = index;

        // ADD THE DRAFT
        inputMsg.value=chatDraft

        if(chatDraft==""){
            // MAKE SEND BUTTON DISAPPEAR
            send.classList.remove("visibleS");
            media.classList.remove("not-visible");
        }else{
            // MAKE SEND BUTTON TO APPEAR
            send.classList.add("visibleS");
            media.classList.add("not-visible");
        }

        const cover =  document.querySelector(".covering")
        if(cover){
            cover.style.display = 'none';
            cover.remove();
        }

        if(!childClick){
            document.querySelector(".chat-container").classList.add("show-chat");
            // if(window.innerWidth<minSize){
            //     // convers.scrollTop = convers.scrollHeight;
            // }
        }
        childClick = false;
    }

    convers.scrollTop = convers.scrollHeight;

}


userChats.forEach((chat)=>{

    const index = chat.chatId;
    messages[index] = ``;
    emails[index] = chat.email;
    chat.messages.forEach((msg)=>{
        //If th message was sent by the user
        if(msg.type=="text"){
            if(msg.sender==id){
                const newMsg = document.createElement("p")
                newMsg.textContent = msg.value;
                
                createMsg(newMsg,msg.type,index,chat.chatName,msg.time);
            //if the message was sent by the chat
            }else{
                receivedMsg(msg);
            }
        }else{
            pendingFile(msg);
        }
    })
});

function pendingFile(msg){

    let newID =  "id"+msg.file.path.split("/")[3].split(".")[0].split(" ")[0];
    // newID = newID.split("_")[1] + newID.split("_")[0];

    let unit = "B"

    let size = msg.file.size;
    

    // kilobyte range
    if(size>1024&&size<(1024*1024)){
        unit = "KB";
        size = Math.floor(size/(1024));
    // Megabyte Range
    }else if(size>(1024*1024)){
        unit = "MB";
        size = Math.floor(size/(1024*1024))
    }

    oopMessage[newID]=msg;
    const newMsg = document.createElement("div");
    const name = msg.file.name[58]?msg.file.name.substring(0,57)+"...":msg.file.name
    const type = msg.type.split("/")[0];
    const lastMsg = type;
    lastMsgs[newID] = lastMsg;
    newMsg.innerHTML = `<div class="file-container" id="${newID}" src="${msg.file.path}">
        <div class="file download">
            <div class="top-left"></div>
            <p class="ext"><i class="uil uil-import"></i></p>
        </div>
        <div class="file-info">
            <h3>${name}</h3>
            <span>${size}${unit}   ${type}</span>
        </div>
    </div>
    <div class="load">
        <h4>download</h4>
        <div class="bar">
            <div class="progress"></div>
        </div>
    </div>`;
    paths[newID]=msg.file.path;            
    // newMsg.querySelector(".file-container").setAttribute("src",msg.file.path)
    const time = msg.time;
    const sender = msg.sender;
    const senderName = msg.senderName;
    const reciever = msg.recipient;
    const msgContainer = document.createElement("div");
        //if the message was sent by you
    if(msg.sender==id){
        msgContainer.classList.add("pos-r-msg");

        const msgBox = document.createElement("div");
        msgBox.classList.add("msg");
        msgBox.classList.add("msg-2");

        const tail = document.createElement("div");
        tail.classList.add("tail");


        const timeBox = document.createElement("span");
        timeBox.classList.add("time");
        timeBox.textContent = time;
        
        msgBox.appendChild(tail);
        msgBox.appendChild(newMsg);
        msgBox.appendChild(timeBox);
        msgContainer.appendChild(msgBox);
        
        //if the message was sent by the chat
    }else{

        const msgBox = document.createElement("div");
        msgBox.classList.add("msg");
        msgBox.classList.add("msg-1");
        
        const tail = document.createElement("div");
        tail.classList.add("tail");
        
        
        const timeBox = document.createElement("span");
        timeBox.classList.add("time");
        timeBox.textContent = time;
        
        msgBox.appendChild(tail);
        msgBox.appendChild(newMsg);
        msgBox.appendChild(timeBox);
        msgContainer.appendChild(msgBox);

    }

    // console.log(receiving)
    
    if(receiving){
        const src = avatarsUrl[sender]?avatarsUrl[sender]:"image/user.png";
        originalChats = `<li class="list-item" id="${sender}">
                            <img class="chat-img" src="${src}" alt="">
                            <div class="chat-values">
                                <p><span class="name">${senderName}</span> <span class="time right">${time}</span></p>
                                <p><span class="last-msg">${lastMsg}</span> <span class="num right"></span></p>
                            </div>
                        </li>`+originalChats;
    
        const repeatSearch =  document.createElement("div");
        repeatSearch.innerHTML = originalChats

        const idExist = [];
    
        repeatSearch.querySelectorAll(".list-item").forEach((item)=>{
            const id = item.id;
            if(idExist[id]){
                repeatSearch.removeChild(item);
            }else{
                idExist[id]=true;
            }
        })
        
        
        originalChats = repeatSearch.innerHTML;

        chatList.innerHTML = originalChats;
        
        chatList.childNodes.forEach(listItem=>{
            listItem.addEventListener("click", show);
            // console.log(listItem.firstChild);
        });

        document.querySelectorAll(".chat-img").forEach((chatImg)=>{
            chatImg.addEventListener("click",showModal);
        })
        
    }

    
    const theID = sender==id?reciever:sender;
    if(theID==convers.id){
        convers.appendChild(msgContainer);
        
        eventDownload(msgContainer);
    
        convers.scrollTop = convers.scrollHeight;

        // STORE MESSAGE IN MESSAGES ARRAY
        messages[theID]=convers.innerHTML;
    }else if(messages[theID]){
        messages[theID] += msgContainer.outerHTML;
    }else{
        messages[theID] = msgContainer.outerHTML;
    }

    receiving=false;

    // console.log(msgContainer,"@",messages[theID],"\n");
}

function eventDownload(dMsg){
    dMsg.querySelector(".file.download").addEventListener("click",()=>{
        if(!downloading){
            downloading=true;
            const index = dMsg.querySelector(".file-container")?dMsg.querySelector(".file-container").id:dMsg.id;
            const path = paths[index];
            // console.log(path,index,dMsg)
            const theMsg = oopMessage[index];
            const file=theMsg.file;
            const {senderName, sender, recipient} = theMsg;
            socket.emit("download",path,file.size,file.name,theMsg.type,sender, recipient, theMsg.time, senderName);
        }else{
            alert("Sorry can't download more than one file at a time");
        }
    })
}



document.querySelectorAll(".chat-list .list-item").forEach((chatItem)=>{
    chats.push(chatItem.outerHTML);
    chatItem.addEventListener("click", show);
});



{/* <li class="list-item">
    <img class="chat-img" src="image/user.png" alt="">
    <div class="chat-values">
        <p><span class="name">Primus</span> <span class="time right">time</span></p>
        <p><span class="last-msg">last-message</span> <span class="num right">1</span></p>
    </div>
</li> */}

document.querySelector(".back-btn").addEventListener("click", ()=>{
    // console.log(convers.id,inputMsg.value);
        if(inputMsg.value){
            const index = convers.id;
            draft[index] = inputMsg.value;
            inputMsg.value = "";
            // console.log(convers.id,inputMsg.value,draft[index]);
            send.classList.remove("visibleS");
            media.classList.remove("not-visible");
        }

        document.querySelector(".chat-container").classList.remove("show-chat");
        document.querySelector(".audio-recorder").classList.remove("visibleS");
});






//Activate / deactive send button while typing

document.querySelector(".type-msg").addEventListener("keyup",checkInputValue);


// document.querySelector(".type-msg").addEventListener("keydown",checkInputValue);



function checkInputValue(){

    if(document.querySelector(".type-msg").value){
       send.classList.add("visibleS");
       media.classList.add("not-visible");

        socket.emit("typing",{typerID: id, chatID: convers.id});


    }else{
        send.classList.remove("visibleS");
        media.classList.remove("not-visible");
    }
}



// Sedimg message
send.addEventListener("click",()=>{
    const typedMsg = inputMsg.value;
    const index = convers.id;
    if(typedMsg&&typedMsg.trim().length>0){

        inputMsg.value = "";

        send.classList.remove("visibleS");
        media.classList.remove("not-visible");
    
    
        const newMsg = document.createElement("p");
        newMsg.textContent = typedMsg;

        sending = true;
        
        createMsg(newMsg,"text");

       
        
    

    }
});


//Message structure
{/* <div class="pos-r-msg">
        <div class="msg msg-2">
            <div class="tail"></div>
            <p>Lorem ipsum dolor sit😂. this is the message😉.
            </p>
            <span class="time">4:43pm</span>
        </div>
    </div> */}


function sendMsg(){
    

    const date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    const time = hours + ':' + minutes + ' ' + ampm;



    const msgContainer = document.createElement("div");
    msgContainer.classList.add("pos-r-msg");

    const msgBox = document.createElement("div");
    msgBox.classList.add("msg");
    msgBox.classList.add("msg-2");

    const tail = document.createElement("div");
    tail.classList.add("tail");

    

    const timeBox = document.createElement("span");
    timeBox.classList.add("time");
    timeBox.textContent = time;
    
    msgBox.appendChild(tail);
    msgBox.appendChild(newMsg);
    msgBox.appendChild(timeBox);
    msgContainer.appendChild(msgBox);
    convers.appendChild(msgContainer);

    convers.scrollTop = convers.scrollHeight;

    send.classList.remove("visibleS");
    media.classList.remove("not-visible");
}



// CUSTOM AUDIO TAG EDIT

let k = 0;
const audio = [];
let playMin = 0;


function asignAudio(audioUrl,id){
    const newAudioMsg = document.createElement("div");
    newAudioMsg.classList.add("audio-msg");
    newAudioMsg.id=k;
    audio[k] = new Audio();
    const audioD = audio[k];

    const src = avatarsUrl[id]?avatarsUrl[id]:"image/user.png"

    newAudioMsg.innerHTML =`<div class="audio-person">
                                <img src="${src}" class="audio-img img" alt="">
                                <i class="fa-solid fa-microphone "></i>
                            </div>
                            <div class="audio-player">
                                <div class="player">
                                    <i class="fa-solid fa-play"></i>
                                </div>
                                <div class="play-length">
                                    <div class="bar">
                                        <div class="fill">
                                        </div>
                                        <div class="hold"></div>
                                    </div>
                                    <span class="time audio-lth">0:00</span>
                                </div>
                                </div>`;
    
    const audioPlay = newAudioMsg.querySelector(".player");
    const playBar = newAudioMsg.querySelector(".bar");
    const fillBar = newAudioMsg.querySelector(".fill");
    const hold = newAudioMsg.querySelector(".hold");
    const audioLth = newAudioMsg.querySelector(".audio-lth");
    const i = audioPlay.querySelector("i");

    audioD.src = audioUrl;

    newAudioMsg.setAttribute("src",audioUrl);
    
    let dragP = false;
	
	playBar.addEventListener('mousedown', (event) => {

        if(!dragP){
            var rect = playBar.getBoundingClientRect(); 
            var x = event.clientX - rect.left; 
    
            var wS = window.getComputedStyle(playBar).width;
            var w = wS.split("p")[0];
            
            const pos = (x/w)*100;
            // console.log("Cursor position: " + (pos));
    
            //Get spesific audio object
            const id = (playBar.parentElement.parentElement.parentElement.id);
            const audioID = audio[id];
    
            audioID.currentTime = (pos*audioID.duration)/100;

        }
        
        
    });

	hold.addEventListener(
		'mouseup', () => dragP = false);
		
	hold.addEventListener(
		'mousedown', () => dragP = true);

    hold.addEventListener(
        'mouseleave', () => dragP = false);
	
    
    hold.addEventListener(
        'mouseenter', () => dragP = false);
	
	hold.addEventListener('mousemove', (event) => {
        if(dragP){

            var rect = hold.parentElement.getBoundingClientRect(); 
            var x = event.clientX - rect.left; 
    
            var wS = window.getComputedStyle(hold.parentElement).width;
            var w = wS.split("p")[0];
            
            const pos = (x/w)*100;
            // console.log("Cursor position: " + (pos));
    
            //Get spesific audio object
            const id = (hold.parentElement.parentElement.parentElement.parentElement.id);
            const audioID = audio[id];
    
            audioID.currentTime = (pos*audioID.duration)/100;
        }
    })

    var getDuration = function (_player,next) {
        _player.addEventListener("durationchange", function (e) {
            if (this.duration!=Infinity) {
               var duration = this.duration
               _player.remove();
               next(duration);
            };
        }, false);    
        _player.load();
        _player.currentTime = 24*60*60; //fake big time
        _player.volume = 0;
        _player.play();
        //waiting...
    };
    
    getDuration (audioD, function (duration) {
        console.log(duration);
    });
    
    i.addEventListener("click",()=>{
        const id = (i.parentElement.parentElement.parentElement.id);
        const audioID = audio[id];

        if(i.classList.contains("fa-play")){
            i.classList.remove("fa-play");
            i.classList.add("fa-pause");
            audioID.volume = 1;
            audioID.play();
        }else{
            i.classList.add("fa-play");
            i.classList.remove("fa-pause");
            audioID.pause();
        }
    })
    audioD.addEventListener("timeupdate",()=>{
        const position = audioD.currentTime / audioD.duration;
        fillBar.style.width = position * 100 + "%";

        //get current audio time
        const time = Math.floor(audioD.currentTime);
        
        audioLth.innerHTML = getTime(time);

    });

    audioD.addEventListener("ended",()=>{
        fillBar.style.width = 0;
        i.classList.add("fa-play");
        i.classList.remove("fa-pause");

        //get audio duration time
        const time = Math.floor(audioD.duration);

        audioLth.innerHTML = getTime(time);
    });
    k++;
    
    return newAudioMsg

}

// function createMsg(Msg){
   
//     const newMsg = Msg;

//     const date = new Date();
//     var hours = date.getHours();
//     var minutes = date.getMinutes();
//     var ampm = hours >= 12 ? 'pm' : 'am';
//     hours = hours % 12;
//     hours = hours ? hours : 12; // the hour '0' should be '12'
//     minutes = minutes < 10 ? '0'+minutes : minutes;
//     const time = hours + ':' + minutes + ' ' + ampm;



//     const msgContainer = document.createElement("div");
//     msgContainer.classList.add("pos-r-msg");

//     const msgBox = document.createElement("div");
//     msgBox.classList.add("msg");
//     msgBox.classList.add("msg-2");

//     const tail = document.createElement("div");
//     tail.classList.add("tail");


//     const timeBox = document.createElement("span");
//     timeBox.classList.add("time");
//     timeBox.textContent = time;
    
//     msgBox.appendChild(tail);
//     msgBox.appendChild(newMsg);
//     msgBox.appendChild(timeBox);
//     msgContainer.appendChild(msgBox);
//     convers.appendChild(msgContainer);

//     convers.scrollTop = convers.scrollHeight;
// }

// asignAudio("sound/wrong.mp3",true);

function getTime(sec){
    let min ;
    if(sec%60==0){
        min = sec/60;
    }else if(sec<60){
        min = 0;
    }else{
        min = Math.floor((sec)/60);
    }

    sec = sec>60?sec%60:sec;

    return sec<10?(min+":0"+sec):(min+":"+sec);
}



//Activate / deactive microphone 
const recorderBox = document.querySelector(".audio-recorder");
const mic = document.querySelector(".mic");
const recTime = document.getElementById("rec-time");


const recordButton = document.getElementById('recordButton');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let recorder, sendRec=false;

//Recording Event
mic.addEventListener('click',() => {

        const mediaStream = navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaStream.then(stream =>{
            
            if (!recorder) {
                console.log(stream)
                const source = audioContext.createMediaStreamSource(stream);
                recorder = new MediaRecorder(stream);
            
                const chunks = []; 
                recorder.addEventListener('dataavailable', (event) => {
                    chunks.push(event.data);
                    console.log(recorder.state);
                });
          
                recorder.addEventListener('stop', () => {
                    recTime.innerText="0:00";
                    clearInterval(timing);

                    if(sendRec){
                        const blob = new Blob(chunks, { type: 'audio/mp3' });
                        // Do something with the audio blob, like upload it to a server
                        const file = new File([blob],"my-voice.mp3", { type: 'audio/mp3' });
                        sending=true;
                        uploading=true;
                        createMsg(file,"audio")
                        // const audioUrl = URL.createObjectURL(blob);
                        // asignAudio(audioUrl,true);
                        convers.scrollTop = convers.scrollHeight;
                    }
                    recorder = null;
                });

                recorder.start();
                let time=0;
                const timing = setInterval( async ()=>{
                    time++;
                    recTime.innerText = getTime(time);
                },1000);
                recorderBox.classList.add("mic-visible");
            }
        }).catch(err=>console.log(err));
});



document.querySelector(".trash").addEventListener("click", async ()=>{
    sendRec = false;
    recorder.stop();
    recorderBox.classList.remove("mic-visible");
});

document.querySelector(".send-rec").addEventListener("click", async ()=>{
    sendRec = true;
    recorder.stop();
    recorderBox.classList.remove("mic-visible");
});


//uplaoding file

function uploadFile(e){

    if(e.target.files[0]){
        const type = e.target.files[0].type;
        uploading=true;
        sending=true;
        createMsg(e.target.files[0],type.split("/")[0]);
    }else{
        alert("No file selected");
        uploading=false;
        sending=false;
    }




}

function createMsg(value,type,recieverId,chatName,stime){

    // GET CONVERSATION ID
    const index = convers.id;

    let newMsg ;
    let lastMsg;
    const up=document.createElement("div");
    up.classList.add("load");
    up.innerHTML = "";

    // console.log(value);
    
    if(type!=="text"){
        const theType = value.type;
        let size = value.size;
        const fname = value.name;
        let ext = fname.split(".")[1];

        if(ext.length>4){
            ext = ext.slice(0,3)+"..";
        }
        let unit = "B"

        // kilobyte range
        if(size>1024&&size<(1024*1024)){
            unit = "KB";
            size = Math.floor(size/(1024));
        // Megabyte Range
        }else if(size>(1024*1024)){
            unit = "MB";
            size = Math.floor(size/(1024*1024))
        }
        if(uploading){
            up.innerHTML = `<h4>uploading...</h4>
            <div class="bar">
                <div class="progress"></div>
            </div>`
        }

        if(type=="image"){
            const url =	URL.createObjectURL(value);
            const img = document.createElement('img');
            img.src = url;
            img.classList.add("img-msg");
            newMsg = img;
            lastMsg = "image";
        }else if(type=="video"){
            const url =	URL.createObjectURL(value);
            const vid = document.createElement('div');
            vid.innerHTML =  `<video class="vid-msg" controls>
            <source src="" type="video/mp4">
            </video>`;
            vid.querySelector("source").setAttribute("src",url);
            newMsg = vid;
            lastMsg = "video";
        }
        else if(type=="audio"){
            const url =	URL.createObjectURL(value);

            newMsg = asignAudio(url,id);
            lastMsg = "voice";
        }else{
            // const url =	URL.createObjectURL(value);
        
            let newFile = document.createElement("div");
            newFile.classList.add("file-container");
        
            // console.log(size);
            const [orderType, extension] = theType.split("/");
            // console.log(fname,orderType,extension);
        
            newFile.innerHTML = `<div class="file">
                                    <div class="top-left"></div>
                                    <h4 class="ext">${ext.toUpperCase()}</h4>
                                </div>
                                <div class="file-info">
                                    <p>${fname}</p>
                                    <span>`+size+``+unit+"     "+orderType+`</span>
                                </div>`;
            
        
            newMsg = newFile;
            lastMsg = "file";
            // createMsg(e.target.files[0],"file");
        }
    }else{
        newMsg = value;
        lastMsg = value.textContent;
    }



    // let changeDay, day;

    // console.log(value.outerHTML);

    // GET VALUE OF MESSAGE

    const date = new Date();

    
    
    var month = date.getMonth()
    var day = date.getDay();
    var dayNum = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    
    
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    let time = hours + ':' + minutes + ' ' + ampm;
    
    // if(BA){

    // }
    // BA.push({
    //     month: month,
    //     day: day,
    //     dayNum: dayNum,
    //     time: time
    // });


    if(stime){
        time = stime;
    }


    // BA.push();



    const msgContainer = document.createElement("div");
    msgContainer.classList.add("pos-r-msg");

    const msgBox = document.createElement("div");
    msgBox.classList.add("msg");
    msgBox.classList.add("msg-2");

    const tail = document.createElement("div");
    tail.classList.add("tail");


    const timeBox = document.createElement("span");
    timeBox.classList.add("time");
    timeBox.textContent = time;
    
    msgBox.appendChild(tail);
    msgBox.appendChild(newMsg);
    if(up.innerHTML){
        msgBox.appendChild(up);
    }
    msgBox.appendChild(timeBox);
    msgContainer.appendChild(msgBox);

   let name;
    if(chatName){
        name = chatName;
    }else{
        name = convers.closest(".container").querySelector(".prof-name.name").innerHTML;
    }

    // console.log(name,convers,convers.closest(".container"), convers.closest(".container").querySelector(".prof-name .name"))



    let listId;
    if(recieverId){
        listId = recieverId;
    }else{
        listId = index;
    }

    lastMsgs[index]= "you: "+lastMsg;

    
    if(!recieverId){
        // IF IT'S A NEW CONVERSATION
        const src = avatarsUrl[listId]?avatarsUrl[listId]:"image/user.png";
        originalChats =`<li class="list-item" id="${listId}">
                            <img class="chat-img" src="${src}" alt="">
                            <div class="chat-values">
                                <p><span class="name">${name}</span> <span class="time right"></span></p>
                                <p><span class="last-msg">you: ${lastMsg}</span> <span class="num right"></span></p>
                            </div>
                            </li>`+originalChats;
    
        const repeatSearch =  document.createElement("div");
        repeatSearch.innerHTML = originalChats
    
        const idExist = [];
    
        repeatSearch.querySelectorAll(".list-item").forEach((item)=>{
            const id = item.id;
            if(idExist[id]){
                repeatSearch .removeChild(item);
            }else{
                idExist[id]=true;
            }
        })
    
        originalChats= repeatSearch.innerHTML;

        chatList.innerHTML = originalChats

        chatList.childNodes.forEach(listItem=>{
            listItem.addEventListener("click", show);
            // console.log(listItem.firstChild);
        });

        document.querySelectorAll(".chat-img").forEach((chatImg)=>{
            chatImg.addEventListener("click",showModal);
        })

    }



    if(recieverId){
        if(recieverId==convers.id){
            convers.appendChild(msgContainer);
        
            convers.scrollTop = convers.scrollHeight;
    
            // STORE MESSAGE IN MESSAGES ARRAY
            messages[recieverId]=convers.innerHTML;
        }else if(messages[recieverId]){
            messages[recieverId] += msgContainer.outerHTML;
        }else{
            messages[recieverId] = msgContainer.outerHTML;
        }
    }else{
        convers.appendChild(msgContainer);
    
        convers.scrollTop = convers.scrollHeight;
    
        // STORE MESSAGE IN MESSAGES ARRAY
        messages[index]=convers.innerHTML;
    }

    if(sending){
        if(type=="text"){
    
            console.log("sending...")
    
            socket.emit("new-msg",id,convers.id,value.innerHTML,time,name,type);
        }else{
            uploadIt(value,name,time,msgContainer)
            
        }
    }
    sending=false;

}

function uploadIt(file,name,time,msgContainer){

    
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    const type = file.type.split("/")[0]
    // console.log(type);
    let path="";
    if(type=="image"){
        path = `./uploads/images/${Date.now()}_${file.name}`
    }else if(type=="video"){
        path = `./uploads/videos/${Date.now()}_${file.name}`
    }else if(type == "audio"){
        path = `./uploads/audios/${Date.now()}_${file.name}`
    }else{
        path = `./uploads/others/${Date.now()}_${file.name}`
    }

    const newID = path.split("/")[3].split(".")[0].split(" ")[0];
    
    msgContainer.setAttribute("id",newID);
    
    reader.onload = () => {
        const CHUNK_SIZE = 16384; // 16 KB
        let offset = 0;
        const fileSize = file.size;
        const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

        // send the file data to the server in chunks
        while (offset < fileSize) {
            const chunk = reader.result.slice(offset, offset + CHUNK_SIZE);
            socket.emit('upload-chunk', {
                filename: file.name,
                data: chunk,
                offset,
                totalChunks,
                fileSize,
                type: file.type,
                path
            }, {userID: id, chatID: convers.id, time: time, name:name});
            offset += CHUNK_SIZE;
        };
    }
}

let receivedData = [];
let receivedSize = 0;

socket.on('upload-progress', ({ progress, fileSize, path})=>{

    let unit = "B"

    let size = fileSize;

    // kilobyte range
    if(size>1024&&size<(1024*1024)){
        unit = "KB";
        size = Math.floor(size/(1024));
    // Megabyte Range
    }else if(size>(1024*1024)){
        unit = "MB";
        size = Math.floor(size/(1024*1024))
    }

    progress = Math.floor(progress);
    // console.log(progress+"%");
    const newID = path.split("/")[3].split(".")[0].split(" ")[0];
    if(document.getElementById(newID).querySelector(".load h4")){
        document.getElementById(newID).querySelector(".load h4").textContent = progress+"%                  "+size+unit;
        document.getElementById(newID).querySelector(".load .progress").style.width = progress+"%"
    }

});

socket.on('upload-success', ({message , fileSize, path})=>{
    let unit = "B"

    let size = fileSize;

    // kilobyte range
    if(size>1024&&size<(1024*1024)){
        unit = "KB";
        size = Math.floor(size/(1024));
    // Megabyte Range
    }else if(size>(1024*1024)){
        unit = "MB";
        size = Math.floor(size/(1024*1024))
    }

    console.log(message);
    const newID = path.split("/")[3].split(".")[0].split(" ")[0];
    document.getElementById(newID).querySelector(".load h4").textContent = size+unit;
    document.getElementById(newID).querySelector(".load").style.display = "none"
    uploading= false;
    
});

socket.on('upload-error', ({message ,  path})=>{
    console.log(message);
    const newID = path.split("/")[3].split(".")[0].split(" ")[0];
    document.getElementById(newID).querySelector(".load h4").textContent = "Unable to send file";
    document.getElementById(newID).querySelector(".load .progress").style.display = none
    document.getElementById(newID).querySelector(".load .progress").style.background = "red"  
    document.getElementById(newID).querySelector(".load h4").style.color = "red";
    uploading= false;


});

socket.on('download-chunk', ({ data, fileSize , path, userID, chatID}) => {
    receivedData.push(data);
    receivedSize += data.byteLength;
    const progress = receivedSize / fileSize * 100;

    let newID = "id"+path.split("/")[3].split(".")[0].split(" ")[0];

    // newID = newID.split("_")[1] + newID.split("_")[0];


    // console.log(newID);
    if(document.querySelector("#"+newID)){
        document.querySelector("#"+newID).parentElement.querySelector(".load").querySelector("h4").textContent = Math.floor(progress)+"%";
        document.querySelector("#"+newID).parentElement.querySelector(".load").querySelector(".progress").style.width = Math.floor(progress)+"%";
    }


    console.log(`Download progress: ${progress.toFixed(2)}%`);
});


socket.on('download-complete', ({ fileSize, filename, type, path },userID, chatID, time, name) => {
    receiving = true;

    console.log('Download complete');
    const blob = new Blob(receivedData);
    const url = URL.createObjectURL(blob);
    // const theType = type.split('/')[0];
    const file = new File([blob], filename, { type: type })

    downloadFile(file,{userID:userID, chatID:chatID, time:time, name:name, path:path})

    // const link = document.createElement('a');
    // link.href = url;
    // link.download = filename;
    // link.click();
    receivedData=[];
    receivedSize = 0;
});


function downloadFile(value,{userID, chatID, time, name, path}){



    const type = value.type.split("/")[0];
    const sender = userID;
    const reciever = chatID;
    const senderName = name;

    const theType = value.type;
    let size = value.size;
    const fname = value.name;
    let ext = fname.split(".")[1];


    if(ext.length>4){
        ext = ext.slice(0,3)+"..";
    }
    let unit = "B"

    // kilobyte range
    if(size>1024&&size<(1024*1024)){
        unit = "KB";
        size = Math.floor(size/(1024));
    // Megabyte Range
    }else if(size>(1024*1024)){
        unit = "MB";
        size = Math.floor(size/(1024*1024))
    }

    if(type=="image"){
        const url =	URL.createObjectURL(value);
        const img = document.createElement('img');
        img.src = url;
        img.classList.add("img-msg");
        newMsg = img;
        lastMsg = "image";
    }else if(type=="video"){
        const url =	URL.createObjectURL(value);
        const vid = document.createElement('div');
        vid.innerHTML =  `<video class="vid-msg" controls>
        <source src="" type="video/mp4">
        </video>`;
        vid.querySelector("source").setAttribute("src",url);
        newMsg = vid;
        lastMsg = "video";
    }else if(type=="audio"){

        const url =	URL.createObjectURL(value);

        newMsg = asignAudio(url,sender)
        lastMsg = "voice";
    }else{
        // const url =	URL.createObjectURL(value);
    
        let newFile = document.createElement("div");
        newFile.classList.add("file-container");
    
        // console.log(size);
        const [orderType, extension] = theType.split("/");
        // console.log(fname,orderType,extension);
    
        newFile.innerHTML = `<div class="file">
                                <div class="top-left"></div>
                                <h4 class="ext">${ext.toUpperCase()}</h4>
                            </div>
                            <div class="file-info">
                                <p>${fname}</p>
                                <span>`+size+``+unit+"     "+orderType+`</span>
                            </div>`;
        
    
        newMsg = newFile;
        lastMsg = "file";
        // createMsg(e.target.files[0],"file");
    }

    // lastMsgs[sender]=lastMsg

    if(downloading){
        let newID = "id"+path.split("/")[3].split(".")[0].split(" ")[0];
        const index = id==sender?reciever:sender;
        
        if(document.getElementById(newID)){
            const div = document.getElementById(newID).parentElement;
            div.innerHTML ="";
            div.appendChild(newMsg);

            messages[index]=convers.innerHTML;

        }else{

            const find = document.createElement("div");
    
    
            find.innerHTML = messages[index];
    
            // console.log(find);
    
            find.querySelector("#"+newID).closest("div").innerHTML = "";
            find.querySelector("#"+newID).closest("div").appendChild(newMsg);
    
            messages[index]=find.innerHTML;
    
            if(index==convers.id){
                // convers.appendChild(find);
        
                // // STORE MESSAGE IN MESSAGES ARRAY
                // messages[index]=convers.innerHTML;
                convers.innerHTML=messages[index];
            }
        }

        downloading=false;
        receivedData=[];
        receivedSize = 0;
    }else{

        const msgContainer = document.createElement("div");
    
        const msgBox = document.createElement("div");
        msgBox.classList.add("msg");
        msgBox.classList.add("msg-1");
    
        const tail = document.createElement("div");
        tail.classList.add("tail");
    
    
        const timeBox = document.createElement("span");
        timeBox.classList.add("time");
        timeBox.textContent = time;
        
        msgBox.appendChild(tail);
        msgBox.appendChild(newMsg);
        msgBox.appendChild(timeBox);
        msgContainer.appendChild(msgBox);
        
    
    
        // console.log(receiving);
        if(receiving){
            const src = avatarsUrl[sender]?avatarsUrl[sender]:"image/user.png";
            originalChats = `<li class="list-item" id="${sender}">
                                <img class="chat-img" src="${src}" alt="">
                                <div class="chat-values">
                                    <p><span class="name">${senderName}</span> <span class="time right">${time}</span></p>
                                    <p><span class="last-msg">${lastMsg}</span> <span class="num right"></span></p>
                                </div>
                            </li>`+originalChats;
        
            const repeatSearch =  document.createElement("div");
            repeatSearch.innerHTML = originalChats
        
            const idExist = [];
        
            // console.log(repeatSearch);
    
            repeatSearch.querySelectorAll(".list-item").forEach((item)=>{
                const id = item.id;
                if(idExist[id]){
                    repeatSearch.removeChild(item);
                }else{
                    idExist[id]=true;
                }
            })
    
            originalChats= repeatSearch.innerHTML;
        }
    
    
        if(sender==convers.id){
            convers.appendChild(msgContainer);
        
            convers.scrollTop = convers.scrollHeight;
    
            // STORE MESSAGE IN MESSAGES ARRAY
            messages[sender]=convers.innerHTML;
        }else if(messages[sender]){
            messages[sender] += msgContainer.outerHTML;
        }else{
            messages[sender] = msgContainer.outerHTML;
        }
    
    }
    
    receiving=false;
    downloading=false;


    receivedData=[];
    receivedSize = 0;

}


socket.on("start-download",(path,fileSize,filename,type,{userID, chatID, time, name})=>{
    // console.log(path)
    const msg = {
        senderName: name,
        sender: userID,
        recipient: chatID,
        type: type,
        time: time,
        file: {
            path: path,
            size: fileSize,
            name: filename
        }
    }
    receiving=true;
    pendingFile(msg);

    // socket.emit("download",path,fileSize,filename,type,userID, chatID, time, name);
});





socket.on("msg-sent",()=>{
    socket.emit("find-avatar",id);
    console.log("msg sent");
})


socket.on("r-msg",(message,conversId)=>{
    // console.log("msg revcieved\n",message);
    console.log(message);
    socket.emit("msg-rsed",id);



    // const index = message.senderId; 
    let found = false;
    userChats.forEach((chat)=>{
        if(chat.chatId==message.sender){
            found = true;
        }
    })

    if(!found){
        userChats.push({
            messages : message,
            conversId: conversId,
            chatName: message.senderName,
            chatId: message.sender
        })
    }

    const sender = message.sender;

    let typing, typing2;
    
    typing = document.getElementById(sender).querySelector(".last-msg");
    if(convers.id == sender){
        typing2 = convers.parentElement.querySelector(".last-seen");
    }

    clearInterval(typingTimer[sender].timing)
    typingTimer[sender].timing=undefined;

    typing.classList.remove("typing");
    typing.textContent=lastMsgs[sender];
    if(typing2){
        typing2.classList.remove("typing");
        typing2.textContent=chatStatus[sender];
    }



    // generateMsg(message.value);

    receiving=true; 

    receivedMsg(message);
    
    chatList.innerHTML = originalChats;
    chatList.childNodes.forEach(listItem=>{
        listItem.addEventListener("click", show);
        // console.log(listItem.firstChild);
    });
    document.querySelectorAll(".chat-img").forEach((chatImg)=>{
        chatImg.addEventListener("click",showModal);
    })
    
});

socket.on("msg-rsed",id=>{
    console.log("He has recieved the message");
});

socket.on("update-status",(statusEvents))

socket.on("status-check",()=>{
    socket.emit("validation",id);
})


function statusEvents({ id, status, lastSeen }){

    
    chatStatus[id] = status=="online"?status:lastSeen;

    if(id==convers.id){
        const lastseen = convers.closest(".container").querySelector(".last-seen");
        lastseen.textContent=chatStatus[id];
    }
}

// function generateMsg(value,id){
//     const newMsg = document.createElement("p");
//     newMsg.textContent=value;

//     const msgContainer = document.createElement("div");

//     const msgBox = document.createElement("div");
//     msgBox.classList.add("msg");
//     msgBox.classList.add("msg-1");

//     const tail = document.createElement("div");
//     tail.classList.add("tail");


//     const timeBox = document.createElement("span");
//     timeBox.classList.add("time");
//     timeBox.textContent = time;
    
//     msgBox.appendChild(tail);
//     msgBox.appendChild(newMsg);
//     msgBox.appendChild(timeBox);
//     msgContainer.appendChild(msgBox);
// }

function receivedMsg(message){

    const {senderName, sender, type, value, time}=message;

    let newMsg;
    let lastMsg;

    // console.log(value,receiving);

    if(type=="text"){
        newMsg = document.createElement("p");
        newMsg.textContent=value;
        lastMsg = value;
    }else{

        // Create a new file from the data
        const fileBlob = new Blob([value.data.toString('base64')], { type: 'application/octet-stream' });
        const file = new File([fileBlob], value.name, { type: 'application/octet-stream' });

        // Trigger a file download

        const theType = file.type;
        let size = file.size;
        const name = file.name;
        let ext = name.split(".")[1];
    
        if(ext.length>4){
            ext = ext.slice(0,3)+"..";
        }
        let unit = "B"
    
        // kilobyte range
        if(size>1024&&size<(1024*1024)){
            unit = "KB";
            size = Math.floor(size/(1024));
        // Megabyte Range
        }else if(size>(1024*1024)){
            unit = "MB";
            size = Math.floor(size/(1024*1024))
        }

        
    
        // console.log(value.type);

        // const blob = new Blob([file.data], { type: file.type });
        // const objectUrl = URL.createObjectURL(blob);
        const url =	URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = file.name;
        downloadLink.click();
        // URL.revokeObjectURL(url);
                
        if(type=="image"){
            const img = document.createElement('img');
            img.src = url;
            img.classList.add("img-msg");
            newMsg = img;
            lastMsg = "image";
        }else{
            let newFile = document.createElement("div");
            newFile.classList.add("file-container");
    
            const [orderType, extension] = theType.split("/");
            // console.log(name,orderType,extension);
    
            newFile.innerHTML = `<div class="file">
                                    <div class="top-left"></div>
                                    <h4 class="ext">${ext.toUpperCase()}</h4>
                                </div>
                                <div class="file-info">
                                    <p>${name}</p>
                                    <span>`+size+``+unit+"     "+orderType+`</span>
                                </div>`;
            

            
            newMsg = newFile;
            lastMsg = "file"
        }
    }

    lastMsgs[sender]=lastMsg
    

    const msgContainer = document.createElement("div");

    const msgBox = document.createElement("div");
    msgBox.classList.add("msg");
    msgBox.classList.add("msg-1");

    const tail = document.createElement("div");
    tail.classList.add("tail");


    const timeBox = document.createElement("span");
    timeBox.classList.add("time");
    timeBox.textContent = time;
    
    msgBox.appendChild(tail);
    msgBox.appendChild(newMsg);
    msgBox.appendChild(timeBox);
    msgContainer.appendChild(msgBox);

   

    // const name = convers.closest(".container").querySelector(".prof-name.name").innerHTML;

    // console.log(name,convers,convers.closest(".container"), convers.closest(".container").querySelector(".prof-name .name"))

    // const lastseen = convers.closest(".container").querySelector(".last-seen");


    // IF IT'S A NEW CONVERSATION
    // console.log(receiving);
    if(receiving){
        const src = avatarsUrl[sender]?avatarsUrl[sender]:"image/user.png";
        originalChats = `<li class="list-item" id="${sender}">
                            <img class="chat-img" src="${src}" alt="">
                            <div class="chat-values">
                                <p><span class="name">${senderName}</span> <span class="time right"></span></p>
                                <p><span class="last-msg">${lastMsg}</span> <span class="num right"></span></p>
                            </div>
                        </li>`+originalChats;

    
        const repeatSearch =  document.createElement("div");
        repeatSearch.innerHTML = originalChats
    
        const idExist = [];
    
        // console.log(repeatSearch);

        repeatSearch.querySelectorAll(".list-item").forEach((item)=>{
            const id = item.id;
            if(idExist[id]){
                repeatSearch.removeChild(item);
            }else{
                idExist[id]=true;
            }
        })

        originalChats= repeatSearch.innerHTML;

        chatList.innerHTML = originalChats;
    }


    if(sender==convers.id){
        convers.appendChild(msgContainer);
    
        convers.scrollTop = convers.scrollHeight;

        // STORE MESSAGE IN MESSAGES ARRAY
        messages[sender]=convers.innerHTML;
    }else if(messages[sender]){
        messages[sender] += msgContainer.outerHTML;
    }else{
        messages[sender] = msgContainer.outerHTML;
    }

    receiving=false;

}


//Click on chat image
const modal = document.querySelector(".modal");
const modalContent = document.querySelector(".modal-content");
const closen = document.querySelector(".modal-close");

function showModal(e){
    // console.log(e.target.parentNode);
    let nm , src, index;

    if(e.target.classList.contains("img-prof")){
 
        nm = e.target.parentNode.parentNode.querySelector(".name").textContent;
        src =  e.target.src
        index = convers.id;

    }else if(e.target.classList.contains("prof-detail")){

        src = e.target.parentNode.querySelector(".chat-img").src
        nm = e.target.querySelector(".name").textContent;
        index = convers.id;

    }else{
        nm = e.target.parentNode.querySelector(".name").textContent
        src =  e.target.src;
        index = e.target.parentNode.id;
    }

    childClick=true;
    modal.querySelector(".modal-name").textContent = nm;
    modal.querySelector(".modal-img").src = src;
    modal.querySelector(".email").textContent = emails[index];



    modal.classList.add("active-modal");
    // document.querySelector(".prof-name").textContent = nm;
}

document.querySelectorAll(".chat-img").forEach((chatImg)=>{
    chatImg.addEventListener("click",showModal);
})

document.querySelector(".prof-detail").addEventListener("click",()=>{
    modal.classList.add("active-modal");
})

modal.addEventListener("click",(e)=>{
    if(!childClick){
        modal.classList.remove("active-modal");
    }
    childClick=false;
})

closen.addEventListener("click",(e)=>{
    childClick=true;
    modal.classList.remove("active-modal");
})

modalContent.addEventListener("click",(e)=>{
    childClick=true;
})


// call container
const callContainer = document.querySelector(".call-container");
const phones = document.querySelectorAll(".audio-call");
const vids = document.querySelectorAll(".video-call");
const closeCall = document.querySelector(".call-close");
const btns = document.querySelectorAll(".call-btns");

phones.forEach((phone)=>{
    phone.addEventListener("click",()=>{
        if(phone.parentElement.parentElement.classList.contains("chat-header")){
            const name = phone.closest(".chat-header").querySelector(".name").textContent;
            
            callContainer.querySelector(".call-img").src = phone.closest(".chat-header").querySelector(".img-prof").src
            callContainer.querySelector("h3.name").textContent = name;

            callContainer.classList.add("show-call");


        }else if(phone.parentElement.parentElement.classList.contains("modal-content")){
            const name = phone.closest(".modal").querySelector(".modal-name").textContent;
            
            callContainer.querySelector(".call-img").src = phone.closest(".modal").querySelector(".modal-img").src
            callContainer.querySelector("h3.name").textContent = name;

            callContainer.classList.add("show-call");


        }else{
            phones.forEach((phone2)=>phone2.classList.add("icon-active"));
            callContainer.classList.add("show-call");
        }
    });
})

vids.forEach((vid)=>{
    vid.addEventListener("click",()=>{
        if(vid.parentElement.parentElement.classList.contains("chat-header")){
            const name = vid.closest(".chat-header").querySelector(".name").textContent;
            
            callContainer.querySelector(".call-img").src = vid.closest(".chat-header").querySelector(".img-prof").src
            callContainer.querySelector("h3.name").textContent = name;

            callContainer.classList.add("show-call");


        }else if(vid.parentElement.parentElement.classList.contains("modal-content")){
            const name = vid.closest(".modal").querySelector(".modal-name").textContent;
            
            callContainer.querySelector(".call-img").src = phone.closest(".modal").querySelector(".modal-img").src
            callContainer.querySelector("h3.name").textContent = name;

            callContainer.classList.add("show-call");


        }else{
            vids.forEach((vid2)=>vid2.classList.add("icon-active"));
            callContainer.classList.add("show-call");
        }
    });
})

closeCall.addEventListener("click",()=>{
    callContainer.classList.remove("show-call");
});


btns.forEach((btn,index)=>{
    btn.addEventListener("click",()=>{
        if(btn.classList.contains("icon-active")){
            btn.classList.remove("icon-active");
        }else{
            btn.classList.add("icon-active");
        } 
    });
})



// SETTING

const settings = document.querySelector(".settings");
const backSetx = document.querySelector(".back-set");
const camera = document.querySelector(".camera");
const myImg = document.querySelector(".my-img");
const change_BG = document.querySelector(".change-background");
const chatBG = document.querySelector(".conversation");

document.querySelector(".logo").addEventListener("click",()=>{
    settings.classList.add("show-setting");
});
document.querySelector(".set-btn").addEventListener("click",()=>{
    settings.classList.add("show-setting");
});
backSetx.addEventListener("click",()=>{
    settings.classList.remove("show-setting")    
});

camera.addEventListener("click",()=>{
    document.getElementById("my-img").click();
})

change_BG.addEventListener("click",()=>{
    document.getElementById("change-background").click();
})

function display(event){
    if(event.target.files[0]){
        const image = URL.createObjectURL(event.target.files[0]);
        myImg.src = image;
    }
}

function changeBG(event){
    if(event.target.files[0]){
        const image = URL.createObjectURL(event.target.files[0]);
        chatBG.style.backgroundImage = 'url('+image+')';
        chatBG.style.backgroundRepeat = 'no-repeat';
        chatBG.style.backgroundSize = 'cover';
        // console.log(chatBG.style.backgroundImage);
    }
}



// Upload button
const upload = document.querySelector(".upload");
const fileInput = document.querySelector("#upload");

upload.addEventListener("click",()=>{
   
    if(!uploading){
        fileInput.click();
        // uploading=true;
    }else{
        alert("Sorry can't send more than one file at a time");
    }
})

window.addEventListener("load",()=>{
    socket.emit("find-avatar",id);
    convers.scrollTop = convers.scrollHeight;
});


socket.on("avatars",avatars=>{

    const userId = id;

    avatars.forEach(({id, path, data})=>{
        if(data){
            const typ = `image/${path.split(".")[path.split(".").length-1]}`; 

            const blob = new Blob([data],{type: typ});
            const url = URL.createObjectURL(blob);
            avatarsUrl[id]=url;
            if(userId==id){
                document.querySelector(".my-img").src=url;
            }else{
                // console.log(id);
                document.getElementById(id).querySelector(".chat-img").src=url;
            }
            originalChats = chatList.innerHTML;
        }

    })

});


function uploadAvatar(event){
    const avatar = event.target.files[0];
    if(avatar){
        if(avatar.size<(1024*1024)*5){
            //upload the avatar to server
            const reader = new FileReader();
            reader.readAsArrayBuffer(avatar);

            const ext = avatar.name.split(".")[avatar.name.split(".").length-1]

            const type = avatar.type.split("/")[0];
            

            let path="";
            if(type=="image"){
                path = `./uploads/avatar/${id}.${ext}`
                reader.onload = () => {
                    // send the file data to the server
                    socket.emit("change-avatar", { path: path, data: reader.result, id: id });
                    image = URL.createObjectURL(avatar);
                };
            }else{
                alert("Select only an image");
            }

        }else{
            alert("Your profile picture should be less than 5MB")
        }
    }
}
    
socket.on('avatar-success', ({ message})=>{
    console.log(message);

    document.querySelector(".my-img").src = image;
    alert("Profile picture uploaded sucessfully");
});

socket.on("frnd-typing",typerID=>{

    if(document.getElementById(typerID)){
        if(!typingTimer[typerID]){
            typingTimer[typerID] = {
                timer: 0,
                timing: ""
            };
        }
    
        let typing, typing2;
        
        typing = document.getElementById(typerID).querySelector(".last-msg");
        
        typing.classList.add("typing");
        typing.textContent="typing...";
    
        if(convers.id == typerID){
            typing2 = convers.parentElement.querySelector(".last-seen");
            
            typing2.classList.add("typing");
            typing2.textContent="typing...";
        }
        
    
        if(typingTimer[typerID].timing){
            clearInterval(typingTimer[typerID].timing);
        }
    
    
    
        typingTimer[typerID].timing = setInterval( async ()=>{
    
            typingTimer[typerID].timer++;
    
    
            if(typingTimer[typerID].timer>=3){
    
    
                typingTimer[typerID].timer=0;
    
                if(typing2){
                    typing2.classList.remove("typing");
                    typing2.textContent=chatStatus[typerID];
                }
    
                typing.classList.remove("typing");
                typing.textContent=lastMsgs[typerID];
    
                clearInterval(typingTimer[typerID].timing);
    
                typingTimer[typerID].timing=undefined;
            }
        },1000);
    }
    
});

convers.scrollTop = convers.scrollHeight;