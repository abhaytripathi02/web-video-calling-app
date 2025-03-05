import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// import path from 'path';


const app = express();
const server = createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

const port = 9000;

const allUsers = {};

app.use(express.static('public'));

//Handles incoming http requests 
app.get('/', (req, res) => {   
    console.log('GET Request / ') 
    res.sendFile(join(__dirname + '/app/index.html'));
    // res.send('Hello World');
});

//Handles incoming socket.io connections
// handle socket connections
io.on("connection", (socket) => {
    console.log(`Someone connected to socket server and socket id is ${socket.id}`);
    socket.on("join-user", username => {
        console.log(`${username} joined socket connection`);
        allUsers[username] = { username, id: socket.id };
        // inform everyone that someone joined
        io.emit("joined", allUsers);
    });

    socket.on("offer", ({from, to, offer}) => {
        console.log({from , to, offer });
        io.to(allUsers[to].id).emit("offer", {from, to, offer});
    });

    socket.on("answer", ({from, to, answer}) => {
       io.to(allUsers[from].id).emit("answer", {from, to, answer});
    });

    socket.on("end-call", ({from, to}) => {
        io.to(allUsers[to].id).emit("end-call", {from, to});
    });

    socket.on("call-ended", caller => {
        const [from, to] = caller;
        io.to(allUsers[from].id).emit("call-ended", caller);
        io.to(allUsers[to].id).emit("call-ended", caller);
    })

    socket.on("icecandidate", candidate => {
        console.log({ candidate });
        //broadcast to other peers
        socket.broadcast.emit("icecandidate", candidate);
    }); 
})


server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});