import io from 'socket.io-client';
import content from '../static.json';
const socket = io(); //openSocket(content.api);

function joinRoom(roomId, user, success, err, update) {
    console.log('called join');
    socket.emit('join-room', { roomId: roomId, user: user });
    socket.on('join-success', success);
    socket.on('join-error', err);
    socket.on('room-update', update);
}

function startRoom(roomId, success, err, update, timer) {
    socket.emit('start-room', { roomId: roomId });
    socket.on('start-success', success);
    socket.on('start-error', err);
    socket.on('poll-update', update);
    socket.on('timer-update', timer);
}

function continueRoom(data, update) {
    socket.emit('continue-room', data);
    socket.on('continue-room', update);
}

function listenContinueRoom(update) {
    socket.on('continue-room', update);
}

function sendPollUpdate(pollItem, roomId) {
    socket.emit('poll-update', { pollItem: pollItem, roomId: roomId });
}

function listenRoom(starting, update, timer) {
    socket.on('starting-room', starting);
    socket.on('poll-update', update);
    socket.on('timer-update', timer);
}

function leaveRoom(isOwner, roomId) {
    socket.emit('leaving-room', { roomId: roomId, isOwner: isOwner });
}

export { joinRoom, startRoom, continueRoom, listenContinueRoom, sendPollUpdate, listenRoom, leaveRoom };