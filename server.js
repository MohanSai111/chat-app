import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import http from 'http';
import { connect } from './config.js';
import { chatModel } from './chat.schema.js';
import { timeStamp } from 'console';

const app= express();
//1.create a http server
const server = http.createServer(app);

//2.create a socket server
const io = new Server( server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
     }
}
)

//3.use socket events

io.on('connection',(socket)=>{
    console.log(" connection is established");

    socket.on("join",(data)=>{
        socket.username= data;
        //send old messages to the client
        chatModel.find().sort({timeStamp:1}).limit(50)
            .then(messages=>{
                socket.emit("load_messages",messages);
            }).catch(err=>{
                console.log(err);
            })
    })

    socket.on("new-message",(message)=>{
        //broadcast this message to all the clients
        let userMessage={
            username:socket.username,
            message:message
        }
        //storing to the database
        const newChat= new chatModel({
            username:socket.username,
            message:message,
            timestamp:new Date()
        });
        newChat.save();
        socket.broadcast.emit("broadcast-message",userMessage)
    })
    socket.on( 'disconnect',()=>{
        console.log("connection is disconnected");
    })
});

server.listen(3000,()=>{
    console.log("App is listening on port 3000");
    connect();
})