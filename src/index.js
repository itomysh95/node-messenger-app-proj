const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,
    generateLocationMessage,} = require('./utils/messages.js')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users.js')
// full duplex communication -> server can send message to client any time, and client can send message
// to server anytime

// server (emit) -> client (recieve) --acknowledgement --> server
// client (emit) -> server (recieve) --acknowledgement --> client

const app = express()
// create a new server to pass our application
const server = http.createServer(app)
// to pass raw server into socketio
const io = socketio(server)
// env port or port 3000
const port = process.env.PORT||3000

const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))


// whenever socket io get's a new connection
io.on('connection',(socket)=>{
    console.log('new web socket connection detected')

    // listener for joining chat room
    socket.on('join', ({username, room}, callback)=>{
        const{error, user} = addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)

        
        socket.emit('welcomeMessage',generateMessage('ADMIN','welcome!'))
        //send to everyone except the current client
        socket.broadcast.to(user.room).emit('message',generateMessage('ADMIN',`${user.username} has joined!`))
        // emit to the room, member list
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // when a client senta message, relay the message to everyone
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        // filtering out profanity
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback('Delivered!')
    })
    // listen for location from client
    socket.on('sendLocation',(cords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.usuername, cords.lat,cords.long))
        callback('location delivered!')
    })
    // built in event disconnect
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        // if the user disconnected from a room
        if(user){
            // emit to the room, who left, who are left
            io.to(user.room).emit('message',generateMessage('ADMIN',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room),
            })
        }
    })

})


app.use(express.json())
server.listen(port,()=>{
    console.log(`server is up on port: ${port}!`)
})
