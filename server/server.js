require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
const { Firestore } = require('@google-cloud/firestore');

const { FirestoreStore } = require('@google-cloud/connect-firestore');
const path = require('path');

const qrcode = require('qrcode');
const { response } = require('express');
const axios = require('axios').default;

const { google } = require('googleapis');
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY
});
const alias = require('./alias.json');

let roomIds = new Set();
let rooms = new Map();
let polls = new Map();
let timers = new Map();

let nicknames = new Map();
let profiles = [];


fs.readdir(path.join(__dirname, 'images'), (err, files) => {
    profiles = files;
});

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    store: new FirestoreStore({
        dataset: new Firestore({
            kind: 'express-sessions',
        }),
    }),
    genid: (req) => {
        console.log('inside session middleware');
        return uuidv4();
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.post('/get-user', (req, res) => {
    console.log(req.session);
    const { nickname, roomId } = req.session;

    res.status(200).send({ user: { 'nickname': nickname, 'roomId': roomId } });
});

app.post('/create-nickname', (req, res) => {
    console.log('/create-nickname POST');
    console.log(req.sessionID);
    console.log(req.body);
    req.session.nickname = req.body.user.nickname;

    shuffle(profiles);
    req.session.profile = profiles[0];

    res.status(200).send({ profile: '/images/' + req.session.profile, profAlias: alias[req.session.profile] });
});

app.post('/create-room', (req, res) => {
    console.log('/create-room POST');
    console.log(req.sessionID);

    if (req.session.nickname) {
        if (req.session.roomId && roomIds.has(req.session.roomId)) {
            res.status(200).send({ id: req.session.roomId });
        } else {
            id = Math.floor(Math.random() * ((10e9) + 1));
            while (roomIds.has(id)) {
                id = Math.floor(Math.random() * ((10e9) + 1));
            }

            roomIds.add(id);
            rooms.set(id, []);

            req.session.roomId = id;
            res.status(200).send({ 'id': id });
        }
    } else {
        res.sendStatus(403);
    }
});

app.post('/request-qr', (req, res) => {
    if (req.session && req.session.roomId)
        qrcode.toDataURL(req.body.url, { errorCorrectionLevel: 'H' }, (err, url) => {
            if (!err) {
                console.log('QR code gen finished.');
                res.status(200).send({ qrCodeUrl: url });
            } else {
                console.error('Error in QR code gen.');
                res.sendStatus(500);
            }
        });
    else
        res.status(403);
});

app.post('/request-yt', (req, res) => {
    if (req.session && req.session.roomId) {
        console.log(`request sent for yt search: ${req.body.search}`);
        youtube.search.list({
            auth: process.env.GOOGLE_API_KEY,
            part: 'snippet',
            q: req.body.search,
            type: 'video',
            maxResults: 1,
            videoEmbeddable: 'true',
            order: 'relevance'
        }, (err, response) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                let vids = response.data.items;
                console.log(`sending videoId ${vids[0].id.videoId}`);
                res.status(200).send({ videoId: vids[0].id.videoId });
            }
        });
    } else
        res.sendStatus(403);
});

app.use(express.static(path.join(__dirname, '..', 'build')));
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'images')));

app.get('/images/:file', (req, res) => {
    const imgPath = path.join(__dirname, 'images', req.params.file);
    if (fs.existsSync(imgPath))
        res.sendFile(imgPath);
    else
        res.sendStatus(404);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

io.on('connection', (socket) => {
    console.log(`client id: ${socket.id} joined.`);

    socket.on('join-room', (data) => {
        console.log('join-room event hit');
        let { roomId, user } = data;
        roomId = Number(roomId);

        if (!nicknames.has(socket.id))
            nicknames.set(socket.id, user);

        console.log(`attempting to join room ${roomId}`);
        console.log(`current roomIds:`);
        console.log(roomIds);

        if (roomIds.has(roomId) && !polls.has(roomId)) {
            currRoom = rooms.get(roomId);
            currRoom.push(socket.id);
            roomStr = roomId.toString();

            console.log(`client id: ${socket.id} joined room ${roomId}.`);
            socket.join(roomStr, () => {
                let roomPars = [];

                nicknames.forEach((v, k, m) => { if (currRoom.indexOf(k) !== -1) roomPars.push(v) });
                socket.emit('join-success', roomPars);
                socket.to(roomStr).emit('room-update', { status: 'new', user: user });
            });
        } else {
            socket.emit('join-error');
        }
    });

    socket.on('start-room', (data) => {
        let { roomId } = data;
        roomId = Number(roomId);

        console.log(`attempting to start room ${roomId}`);
        console.log(`current roomIds:`);
        console.log(roomIds);

        if (roomIds.has(roomId)) {
            currRoom = rooms.get(roomId);
            roomStr = roomId.toString();

            polls.set(roomId, {});
            // pollTotals.set(roomId, 0);
            socket.emit('start-success');
            socket.to(roomStr).emit('starting-room');

            let timer = 30;
            const countDown = setInterval(() => {
                timer--;
                io.in(roomStr).emit('timer-update', { time: timer });
                if (timer === 0) {
                    clearInterval(countDown);
                    timers.delete(roomId);
                }
            }, 1000);

            timers.set(roomId, countDown);
        } else {
            socket.emit('start-error');
        }
    });

    socket.on('poll-update', (data) => {
        let { pollItem, roomId } = data;
        roomId = Number(roomId);

        if (roomIds.has(roomId)) {
            currRoom = rooms.get(roomId);
            roomStr = roomId.toString();

            console.log(`client id: ${socket.id} has sent poll update to room ${roomId}.`);
            if (polls.get(roomId)[pollItem]) {
                polls.get(roomId)[pollItem] += 1;
            } else {
                polls.get(roomId)[pollItem] = 1;
            }

            // pollTotals.get(roomId) += 1;

            // if (pollTotals.get(roomId) === rooms.get(roomId).length)
            //     io.in(roomStr).emit('poll-complete');
            // else
            io.in(roomStr).emit('poll-update', { pollItem: pollItem });
            // else if (status === 'delete') {
            //     if (polls.get(roomId)[pollItem]) {
            //         polls.get(roomId)[pollItem] -= 1;
            //         socket.to(roomStr).emit('poll-update', {status: status, pollItem: pollItem});
            //     }
            // }
        }
    });

    socket.on('continue-room', (data) => {
        const { status, roomId } = data;

        if (status === 'poll-finished') {
            if (roomIds.has(roomId) && polls.has(roomId)) {
                currRoom = rooms.get(roomId);
                roomStr = roomId.toString();

                console.log(`poll finished room ${roomId}`);

                if (timers.has(roomId)) {
                    clearInterval(timers.get(roomId));
                    timers.delete(roomId);
                }

                const pollRes = polls.get(roomId);

                let currMax = 0;
                let total = 0;
                let currMaxItem = "";
                let items = []
                for (const key in pollRes) {
                    items.push(key);
                    total += pollRes[key];

                    if (pollRes[key] > currMax) {
                        currMax = pollRes[key];
                        currMaxItem = key;
                    }
                }

                if (currMax / total > 0.5) {
                    socket.emit('continue-room', { status: 'found-winner', currMaxItem: currMaxItem, votes: currMax });
                } else {
                    shuffle(items)
                    socket.emit('continue-room', { status: 'found-winner', currMaxItem: items[0], votes: -1 });
                }
            }
        } else if (status === 'poll-reset') {
            if (roomIds.has(roomId)) {
                currRoom = rooms.get(roomId);
                roomStr = roomId.toString();

                polls.set(roomId, {});
                console.log(`resetting poll in room ${roomId}`);
                console.log(polls.get(roomId));

                io.in(roomStr).emit('continue-room', { status: 'poll-reset' });

                let timer = 30;
                const countDown = setInterval(() => {
                    timer--;
                    io.in(roomStr).emit('timer-update', { time: timer });
                    if (timer === 0) {
                        clearInterval(countDown);
                        timers.delete(roomId);
                    }
                }, 1000);

                timers.set(roomId, countDown);
            }
        }
    });

    socket.on('leaving-room', (data) => {
        let { roomId, isOwner } = data;
        roomId = Number(roomId);

        if (roomIds.has(roomId)) {
            roomStr = roomId.toString();

            if (isOwner) {
                socket.leave(roomStr);
                socket.to(roomStr).emit('room-update', { status: 'force-leave', user: null });
            } else {
                socket.leave(roomStr);
            }

            console.log(`client ${socket.id} leaving room ${roomStr} due to exit`);
            socket.to(roomStr).emit('room-update', { status: 'delete', user: nicknames.get(socket.id) });

            if (timers.has(roomId)) {
                clearInterval(timers.get(roomId));
                timers.delete(roomId);
            }

            let arr = rooms.get(roomId);

            arr.splice(arr.indexOf(socket.id), 1);

            if (arr.length == 0) {
                console.log(`deleting empty room ${roomId}`);
                polls.delete(roomId);
                rooms.delete(roomId);
                roomIds.delete(roomId);
            }
        }
    });

    socket.on('disconnecting', () => {
        console.log(socket.rooms);
        if (socket.rooms) {
            Object.keys(socket.rooms).forEach(room => {
                roomId = parseInt(room);
                let arr = rooms.get(roomId);

                if (arr) {
                    console.log(`client ${socket.id} leaving room ${room}`);
                    socket.to(room).emit('room-update', { status: 'delete', user: nicknames.get(socket.id) });
                    arr.splice(arr.indexOf(socket.id), 1);

                    if (arr.length == 0) {
                        console.log(`deleting empty room ${roomId}`);
                        polls.delete(roomId);
                        rooms.delete(roomId);
                        roomIds.delete(roomId);
                    }
                }
            });

            nicknames.delete(socket.id);
        }
    });

    socket.on('disconnect', () => {
        console.log(`client id: ${socket.id} left.`);
    });
});

http.listen(3000, () => {
    console.log('Listening on localhost:3000');
});