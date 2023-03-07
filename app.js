// require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const multer = require('multer');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy
const findOrCreate =  require("mongoose-findorcreate");

const fs = require('fs');
const { Readable } = require('stream');
const { rejects } = require("assert");
// const Grid = require('gridfs-stream');


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    name: String,
    avatar: {
      type: String,
      default: 'default.png',
    },
    status: {
      type: String,
      default: 'offline',
      enum: ['online', 'offline', 'away', 'busy'],
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    chats: [{
      conversId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
      chatId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      chatName: String
    }]
  });
  
  const messageSchema = new mongoose.Schema({
    convers: [{
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        recipient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderName:{
          type: String,
          required: true
        },
        value: {
          type: String,
          // required: true,
        },
        type: {
          type: String,
          enum: ['text', 'file', 'image', 'video', 'audio'],
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        }, 
        time: String ,
        file: {
            path: String,
            size: String,
            name: String
        }
    }]
  });
  

const app = express();


const server = require("http").createServer(app);

const io = require("socket.io")(server, { cors: { origin: "*"}});


app.use(express.static("public"));

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(session({
    secret: "ThisIsMyLittleSecret",
    resave: false,
    saveUninitialized: true
}));
  
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URL,{useNewUrlParser: true});

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   console.log('MongoDB connection successful');
// });

// var Grid = require('gridfs-stream');
// Grid.mongo = mongoose.connection;
// var gfs = new Grid("db", mongoose.mongo.db);

// Define a storage engine for multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}_${file.originalname}`);
//   },
// });


// // // Initialize multer with the storage engine
// const upload = multer(multer({ dest: 'uploads/' }));


const Message = mongoose.model("Message", messageSchema);


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// level 2 
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User =  mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
});
  
passport.deserializeUser(function(user, cb) {
process.nextTick(function() {
    return cb(null, user);
});
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://bluechat.onrender.com/auth/google/welcome",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    const email = profile.name.familyName+profile.name.givenName+"@gmail.com";
    const name = profile.displayName
    User.findOrCreate({ googleId: profile.id ,name: name, username: email}, function (err, user) {
      return cb(err, user);
    });
  }
));

// passport.use(new FacebookStrategy({
//     clientID: process.env.APP_ID,
//     clientSecret: process.env.APP_SECRET,
//     callbackURL: "https://secretblogs.onrender.com/auth/facebook/secrets"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));


app.get("/", (req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/chat");
    }else{
        res.redirect("/login");
    }
});







app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/welcome", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/welcome');
});

// app.get("/auth/facebook",
//   passport.authenticate("facebook"));

// app.get("/auth/facebook/secrets",
//   passport.authenticate("facebook", { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/secrets');
//   });






app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/signup", (req,res)=>{
    res.render("signup");
});

app.get("/logout", (req,res)=>{
    req.logout(function(err) {
        if (err) { 
            console.log(err); 
        }
        res.redirect('/login');
      });
});

app.get("/welcome",(req,res)=>{

    User.findById(req.user.id, (err, foundUsers)=>{
        if(err){
            console.log(err);
        }else if(foundUsers){
            res.render("welcome",{id: req.user.id});
        }else{
            res.redirect("/login");
        }
    });

    // if(req.isAuthenticated()){
    // }else{
    // }
});

app.get("/chat",(req,res)=>{
    if(req.isAuthenticated()){
        console.log(req.user.id)
        User.findById(req.user.id, (err, foundUser)=>{
            if(err){
                console.log(err);
            }else if(foundUser){

                console.log(foundUser);
                const user = {
                    username: foundUser.username,
                    name: foundUser.name,
                    id: req.user.id
                }
                const chats = foundUser.chats;
                const sendChats = [];
                // let chatExist = false;

                
                if(chats.length<=0){
                    res.render("chat",{
                        userInfo: user,
                        userChats: []
                    });
                }else{
                    const lastIndex = chats.length-1;
                    chats.forEach((chat,index)=>{

                        Message.findById(chat.conversId,(err,foundConvers)=>{

                            if(err){
                                console.log(err);
                            }else if(foundConvers){
                                
                                // console.log(foundConvers.convers);

                                User.findById(chat.chatId,async(err,chatUser)=>{


                                    let l = sendChats.push({
                                        messages : foundConvers.convers,
                                        conversId: chat.messagesId,
                                        chatName: chat.chatName,
                                        chatId: chat.chatId,
                                        email: chatUser.username
                                    });

                                    chatUser.save(()=>{
                                        if(l-1==lastIndex)
                                        res.render("chat",{
                                            userInfo: user,
                                            userChats: sendChats
                                        });

                                    })
                                })
                                    
                               
                                
                                
    
                            }else{
    

                                console.log("no msg with this chat")

                                User.findById(chat.chatId,(err,chatUser)=>{
                                    
                                    sendChats.push({
                                        messages : [],
                                        conversId: chat.messagesId,
                                        chatName: chat.chatName,
                                        chatId: chat.chatId,
                                        email: chatUser.username
                                    });

                                    chatUser.save(()=>{
                                        if(l-1==lastIndex)
                                        res.render("chat",{
                                            userInfo: user,
                                            userChats: sendChats
                                        });
                                    })
                                })
    
                            }
                        })

                    })

                }          

            }
        });
    }else{
        res.redirect("/login");
    }
})




app.post("/signup", (req,res)=>{

    const {fname, lname} = req.body;
    const name = fname+" "+lname;

    User.register({username: req.body.username, name: name}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/welcome");
            });
        }
    })
    
});

app.post("/login",(req,res)=>{

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err)=>{
        if(err){
            console.log(err);
        }else{
            // console.log("login");
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/chat");
            });
        }
    });

});

// app.post("/submit",(req,res)=>{
//     const submittedSecret = req.body.secret;
//     console.log(req.user.id);

//     User.findById(req.user.id, ( err, foundUser)=>{
//         if(err){
//             console.log(err);
//         }else if(foundUser){
//             foundUser.secret = submittedSecret;
//             foundUser.save(()=>{
//                     res.redirect("/secrets")
//             })
//         }
//     });
// });


server.listen(process.env.PORT||3000,()=>{
    console.log("Server running on port 3000");
});

io.on("connection", (socket)=>{

    
    socket.on('change-avatar', ({ path, data, id }) => {
        // write the file to disk
        fs.writeFile(path, Buffer.from(data), (err) => {
          if (err) {
            console.error(err);
            socket.emit('avatar-error', { message: 'File upload failed' });
          } else {
            User.findById(id,(err,foundChat)=>{
                foundChat.avatar = path;
                foundChat.save();
            });

            socket.emit('avatar-success', { message: 'File upload successful' });
            
          }
        });
    });



    socket.on("send-id", (id)=>{
        socket.join(id);

        
        const userId = id;

        console.log("A user is connected: "+userId);

        // const currentTime = new Date();
        User.updateOne({ _id: userId }, { status: 'online' , lastSeen: undefined}, (err, res) => {
            if (err) {
              console.error(err);
              return;
            }          
        });

        User.find({ chats: { $elemMatch: { chatId: userId } }  },(err,foundChats)=>{


            foundChats.forEach((chat)=>{   




                const id = chat._id.toString();
                io.to(id).emit("update-status",{ id: userId, status: 'online', lastSeen: ""});

                if(io.sockets.adapter.rooms.get(id)){
                    chat.status = 'online';
                    chat.lastSeen = undefined;
                    chat.save();
                    User.find({ chats: { $elemMatch: { chatId: id } }  },(err,foundChats)=>{
    
                        foundChats.forEach((chat)=>{
                            const index = chat._id.toString();
                            io.to(index).emit("update-status",{ id: id, status: 'online', lastSeen: ""});
                        })
            
                    })
                }else{
                    const date = new Date();
                    var hours = date.getHours();
                    var minutes = date.getMinutes();
                    
                    
                    var ampm = hours >= 12 ? 'pm' : 'am';
                    hours = hours % 12;
                    hours = hours ? hours : 12; // the hour '0' should be '12'
                    minutes = minutes < 10 ? '0'+minutes : minutes;
                    const time = hours + ':' + minutes + ' ' + ampm;

                    chat.status = 'offline';
                    chat.lastSeen = chat.lastSeen?chat.lastSeen:date;
                    chat.save();

                    User.find({ chats: { $elemMatch: { chatId: id } }  },(err,foundChats)=>{
    
                        foundChats.forEach((chat)=>{
                            const index = chat._id.toString();
                            io.to(index).emit("update-status",{ id: id, status: 'offline', lastSeen: "lastseen today at "+time});
                        })
                    })
                }
            })
        })

        socket.on("disconnect",  ()=>{
            const date = new Date();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            
            
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            const time = hours + ':' + minutes + ' ' + ampm;

            console.log(id+" is disconnected");
            // User.findOne({_id: userId}, (err, foundUser)=>{
            //     foundUser.push({ status: 'offline', lastSeen: date })
            //     foundUser.save();
            // });
            User.updateOne({ _id: userId }, { status: 'offline', lastSeen: date }, (err, res) => {
                if (err) {
                  console.error(err);
                  return;
                }
            });
            
            User.find({ chats: { $elemMatch: { chatId: userId } }  },(err,foundChats)=>{

                foundChats.forEach((chat)=>{
                    const index = chat._id.toString();
                    io.to(index).emit("update-status",{ id: userId, status: 'offline', lastSeen: "last seen today at "+time });
                })
    
            })
        })

    });

    socket.on("validation",id=>{
        User.updateOne({ _id: id }, { status: 'online', lastSeen: "" }, (err, res) => {
            if (err) {
              console.error(err);
              return;
            }
        });
    });


    socket.on("chat-status",chatId=>{
        User.findById(chatId,(err,foundChat)=>{
            if(err){
                console.log(err);
            }
            else if(foundChat){
                const {status, lastSeen} = foundChat;

                const date = new Date();

                if(status=="offline"&&lastSeen){
                    var hours = lastSeen.getHours();
                    var minutes = lastSeen.getMinutes();
                    
                    
                    var ampm = hours >= 12 ? 'pm' : 'am';
                    hours = hours % 12;
                    hours = hours ? hours : 12; // the hour '0' should be '12'
                    minutes = minutes < 10 ? '0'+minutes : minutes;
                    const time = hours + ':' + minutes + ' ' + ampm;
                    socket.emit("update-status",{ id: chatId, status: status, lastSeen: "last seen today at "+time });
                }else{
                    socket.emit("update-status",{ id: chatId, status: status, lastSeen: " " });
                }

            }
        })
    });

    socket.on("find-avatar",(id)=>{
        const avatars = [];
        // console.log("finding avatars");

        

        User.find({ chats: { $elemMatch: { chatId: id } }  },(err,foundChats)=>{



            foundChats.forEach(async (chat, index)=>{
                try{

                    const value = await readFile(chat.avatar);
                    // const value = fs.readFileSync(chat.avatar);

                    avatars.push({
                        data: value,
                        path: chat.avatar,
                        id: chat._id.toString()
                    });

                    
                }catch(error){

                    console.log(error)
                    
                }
                if(foundChats.length-1==index){

                    User.findById(id,async (err,user)=>{
                        if(err){
                            console.log(err);
                        }else{
                            try{
                                avatars.push({
                                    data: await readFile(user.avatar),
                                    path: user.avatar,
                                    id: id
                                });
            
                            }catch(error){
                                console.log(error);
                            }
                        }
                        socket.emit("avatars",avatars);
                    })
                    

                }

            })
            
        })
    })

    socket.on("search",(chat,id)=>{

        let showName = [];

        User.find({ _id : {$ne: id}}, (err, foundUsers)=>{
            if(err){
                console.log(err);
            }else if(foundUsers){
                showName = [];

               foundUsers.forEach((foundUser)=>{

                    const foundName = foundUser.name?foundUser.name.toUpperCase():foundUser.username.toUpperCase();

                    if(foundName.includes(chat)){
                        showName.push(foundUser);
                    }

               })

            //    console.log("similar names: \n",showName);
               socket.emit("recieved-users",showName);
            //    console.log("found users: \n",foundUsers);

            }else{
                console.log("no such user")
            }

        })
        // console.log(chat,id);
    })


    socket.on("new-msg",(userID,chatID,msg,time,chatName,type)=>{

        
        User.findById( userID, (err,foundUser)=>{
            if(err){
                console.log(err);
            }else if(foundUser){
                
                console.log(foundUser)
                
                const userName = foundUser.name?foundUser.name:foundUser.username.split("@")[0];
                
                let message;



                if(type=="text"){
                    message = {
                        senderName: userName,
                        sender: userID,
                        recipient: chatID,
                        type: type,
                        value: msg,
                        time: time,
                    }
                }

                if(foundUser.chats.length>0){

                    foundUser.chats.every((chat,index)=>{
                        
                            if(chat.chatId==chatID){
                                //if the chat already exits


                                Message.findById(chat.conversId, (err, foundConvers)=>{
                                    if(err){
                                        console.log(err);
                                    }else if(foundConvers){
                                        foundConvers.convers.push(message);
                                        foundConvers.save(()=>{
                                            socket.emit("msg-sent");
                                            socket.to(chatID).emit("r-msg",message);
                                        })
                                    }else{
                                        console.log("messages not found");
                                    }
                                });
                                return false;
                            }
                            else if(index==foundUser.chats.length-1){
    
        
                                const newConvers = new Message({
                                    convers: [message]
                                });
        
                                const conversation = newConvers.save();
                                // console.log(conversation);
        
                                // console.log("Saved new converation \n Conversid: "+newConvers.id);
        
                                foundUser.chats.push({
                                    chatId: chatID,
                                    chatName: chatName,
                                    conversId: newConvers.id
                                })
                                foundUser.save(()=>{
                                    sendToReciever(chatID,userID,userName,newConvers.id,message)
                                });
                            }
    
                        return true;
                    })

                }else{

                    const newConvers = new Message({
                        convers: [message]
                    }
                    );

                    const conversation = newConvers.save();
                    // console.log(conversation);
                    foundUser.chats.push({
                        chatId: chatID,
                        chatName: chatName,
                        conversId: newConvers.id
                    })


                    foundUser.save(()=>{
                            sendToReciever(chatID,userID,userName,newConvers.id,message)
                    });
                }
            }
        })
    })

    function sendToReciever(chatID,userID,userName,id,message,fileSize,filename,type,time){
        User.findById( chatID, (err,foundUser)=>{
            if(err){
                console.log(err);
            }else{
                foundUser.chats.push({
                    chatId: userID,
                    chatName: userName,
                    conversId: id
                })
                foundUser.save(()=>{
                        socket.emit("msg-sent");
                        if(message.type!="text"){
                            console.log(message.value);
                            socket.to(chatID).emit("start-download",message.value.path,fileSize,filename,type,{userID:userID, chatID:chatID, time: time, name:userName});
                        }else{
                            socket.to(chatID).emit("r-msg",message,id);
                        }
                });
            }
        })
    }
// let fileName="";
    socket.on('upload-chunk', ({ filename, data, offset, totalChunks, fileSize, type ,path},{userID, chatID, time, name}) => {

        const chatName = name;
        const theType = type.split("/")[0];

            fs.open(path, 'a', (err, fd) => {
            if (err) {
              console.error(err);
              socket.emit('upload-error', { message: 'File upload failed', path: path  });
            } else {
              // write the chunk to disk using the file descriptor
              fs.write(fd, data, 0, data.length, offset, (err) => {
                if (err) {
                  console.error(err);
                  socket.emit('upload-error', { message: 'File upload failed', path: path });

                } else {
                  const progress = (offset + data.length) / fileSize * 100;
                  socket.emit('upload-progress', { progress , fileSize: fileSize, path: path});

                  if (offset + data.length === fileSize) {
                    socket.emit('upload-success', { message: 'File upload successful', fileSize: fileSize, path: path });
                    //SAVE PATH TO DATABASE
                    User.findById( userID, (err,foundUser)=>{
                        if(err){
                            console.log(err);
                        }else if(foundUser){
                            
                            // console.log(foundUser)
                            const userName = foundUser.name?foundUser.name:foundUser.username.split("@")[0];

                            const message = {
                                senderName: userName,
                                sender: userID,
                                recipient: chatID,
                                type: theType,
                                time: time,
                                file: {
                                    path: path,
                                    size: fileSize,
                                    name: filename
                                }
                            }
                            
                            if(foundUser.chats.length>0){

                                foundUser.chats.every((chat,index)=>{
                                    
                                        // fileName = filename
                                        if(chat.chatId==chatID){
                                            //if the chat already exits
            
            
                                            Message.findById(chat.conversId, (err, foundConvers)=>{
                                                if(err){
                                                    console.log(err);
                                                }else if(foundConvers){
                                                    foundConvers.convers.push(message);
                                                    foundConvers.save(()=>{
                                                        socket.emit("msg-sent");
                                                        io.to(chatID).emit("start-download",path,fileSize,filename,type,{userID:userID, chatID:chatID, time:time, name:userName});
                                                        
                                                        // socket.to(chatID).emit("r-msg",message);
                                                    })
                                                }else{
                                                    console.log("messages not found");
                                                }
                                            });
                                            return false;
                                        }
                                        else if(index==foundUser.chats.length-1){
                
                    
                                            const newConvers = new Message({
                                                convers: [message]
                                            });
                    
                                            const conversation = newConvers.save();
                                            // console.log(conversation);
                    
                                            console.log("Saved new converation \n Conversid: "+newConvers.id);
                    
                                            foundUser.chats.push({
                                                chatId: chatID,
                                                chatName: chatName,
                                                conversId: newConvers.id
                                            })
                                            foundUser.save(()=>{
                                                sendToReciever(chatID,userID,userName,newConvers.id,message,fileSize,filename,type,time)
                                            });
                                        }
                
                                    return true;
                                })
            
                            }else{
            
                                const newConvers = new Message({
                                    convers: [message]
                                }
                                );
            
                                const conversation = newConvers.save();
                                // console.log(conversation);
                                foundUser.chats.push({
                                    chatId: chatID,
                                    chatName: chatName,
                                    conversId: newConvers.id
                                })
            
            
                                foundUser.save(()=>{
                                        sendToReciever(chatID,userID,userName,newConvers.id,message,fileSize,filename,type,time)
                                });
                            }
                        }
                    });


                    // sendFileTo(path,room)
                  }
                }
                // close the file descriptor
                fs.close(fd, (err) => {
                  if (err) {
                    console.error(err);
                  }
                });
              });
            }
        });
    });

    socket.on('download', ( path, fileSize, filename, type, userID, chatID, time, name) => {

        // console.log(path);
        const filePath = path;
        const stream = fs.createReadStream(filePath);
        let totalSize = 0;
    
        stream.on('data', (chunk) => {
          totalSize += chunk.length;
          socket.emit('download-chunk', { data: chunk, fileSize: fileSize , path: path, userID: userID, chatID: chatID });
        });
    
        stream.on('end', () => {
          socket.emit('download-complete', { fileSize: totalSize , filename: filename, type: type, path: path},userID, chatID, time, name);
        });
    
        stream.on('error', (err) => {
          console.error(err);
          socket.emit('download-error', { message: 'File download failed' });
        });
    });


    socket.on("typing",({typerID,chatID})=>{
        io.to(chatID).emit("frnd-typing",typerID);
    });

})
  


function readFile(path){
   return new Promise((resolve,rejects)=>{
    fs.readFile(path, (err, data) => {
        if (err) {
            rejects("not found");
        } else {
            resolve(data);
        }
    });
   });
}

