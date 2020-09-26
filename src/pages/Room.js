import React from 'react';
import '../css/Room.scss';
import UserContext from '../context/UserContext';
import { joinRoom, startRoom, continueRoom, listenContinueRoom, sendPollUpdate, listenRoom, leaveRoom } from '../io/io-api';
import axios from 'axios';
import { Redirect } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import RoomParList from '../components/RoomParList';
import { css } from "@emotion/core";
import BeatLoader from 'react-spinners/BeatLoader';
import content from '../static.json';
import Poller from '../components/Poller';
import { Plus, PeopleFill } from 'react-bootstrap-icons';
import PollResultsList from '../components/PollResultsList';
import ReactPlayer from 'react-player/youtube';
import WarningModal from '../components/WarningModal';
import MediaQuery from 'react-responsive';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import _ from 'lodash';

const override = css`
    display: block;
    margin: 0 auto;
`;

class Room extends React.Component {
    static contextType = UserContext;
    constructor(props) {
        super(props);

        this.state = { started: false, validated: false, foundWinner: false, currMaxItem: {}, videoId: '', showContinueBtn: true, poll: {}, totalVotes: 0, pollItem: null, formSubmitted: false, timer: 30, id: this.props.match.params.id, joined: false, roomPars: [], showRoomPars: false, qrCodeUrl: '', exiting: false, confirmExit: false, profResolved: false };

        this.toggleRoomPars = this.toggleRoomPars.bind(this);

        this.joinRoomSuccess = this.joinRoomSuccess.bind(this);
        this.joinRoomError = this.joinRoomError.bind(this);
        this.joinRoomUpdate = this.joinRoomUpdate.bind(this);

        this.requestQRCodeUrl = this.requestQRCodeUrl.bind(this);
        this.startPollKar = this.startPollKar.bind(this);

        this.startRoomSuccess = this.startRoomSuccess.bind(this);
        this.startRoomError = this.startRoomError.bind(this);
        this.pollUpdate = this.pollUpdate.bind(this);
        this.roomStarting = this.roomStarting.bind(this);
        this.timerUpdate = this.timerUpdate.bind(this);

        this.handleChange = this.handleChange.bind(this);
        this.validate = this.validate.bind(this);
        this.onPollSubmit = this.onPollSubmit.bind(this);

        this.handleContinueRoom = this.handleContinueRoom.bind(this);
        this.continueRoomUpdate = this.continueRoomUpdate.bind(this);

        this.leaveRoom = this.leaveRoom.bind(this);
        this.onRoomLeave = this.onRoomLeave.bind(this);
        this.onRoomLeaveCancel = this.onRoomLeaveCancel.bind(this);
    }

    componentDidMount() {
        console.log('comp mounted');
        console.log('context object:');
        console.log(this.context);

        const user = { nickname: this.context.user.nickname, profile: this.context.user.profile };

        console.log('user object:');
        console.log(user);

        if (this.context.user.roomId) {
            this.setState({profResolved: true});
            joinRoom(this.context.user.roomId, this.context.user, this.joinRoomSuccess, this.joinRoomError, this.joinRoomUpdate);
        }
            //  else if (this.props.isJoining) {
            //     this.setState({profResolved: true});
            //     joinRoom(this.state.id, this.context.user, this.joinRoomSuccess, this.joinRoomError, this.joinRoomUpdate);
            // }
    }

    toggleRoomPars() {
        this.setState(prevState => ({ showRoomPars: !prevState.showRoomPars }));
    }

    joinRoomSuccess(roomPars) {
        console.log(`joined ${this.state.id} successfully`);
        console.log(roomPars);
        this.setState({ joined: true, roomPars: roomPars });

        if (this.context.user.roomId)
            this.requestQRCodeUrl();
        else
            listenRoom(this.roomStarting, this.pollUpdate, this.timerUpdate);
    }

    joinRoomError() {
        console.log(`error joining room ${this.state.id}`);
    }

    joinRoomUpdate(data) {
        const { status, user } = data;
        console.log('room update');

        console.log(`${status}: ${user}`);
        console.log(this.state.roomPars);

        if (status === 'new')
            this.setState(prevState => {
                prevState.roomPars.push(user);
                return { roomPars: prevState.roomPars }
            });
        else if (status === 'delete') {
            this.setState(prevState => {
                let index = _.findIndex(prevState.roomPars, user);
                if (index !== -1)
                    prevState.roomPars.splice(index, 1);
                return { roomPars: prevState.roomPars }
            });
        } else if (status === 'force-leave') {
            console.log('received force leave update');
            leaveRoom(false, this.state.id);
            this.setState({ exiting: true, confirmExit: true });
        }
    }

    requestQRCodeUrl() {
        axios.post(content.api + '/request-qr', { url: content.api + `/${this.state.id}/join` })
            .then(res => {
                console.log(res);
                if (res.status === 200)
                    this.setState({ qrCodeUrl: res.data.qrCodeUrl });
            })
            .catch(err => {
                console.error(err);
            });
    }

    startPollKar() {
        console.log('room started...');
        startRoom(this.context.user.roomId, this.startRoomSuccess, this.startRoomError, this.pollUpdate, this.timerUpdate);
    }

    startRoomSuccess() {
        console.log('room started successfully');
        this.setState({ started: true });
    }

    startRoomError() {
        console.log('error starting room');
    }

    pollUpdate(data) {
        const { pollItem } = data;
        console.log(`got poll update: ${pollItem}`);

        this.setState(prevState => {
            if (prevState.poll[pollItem])
                prevState.poll[pollItem] += 1;
            else
                prevState.poll[pollItem] = 1;

            return { poll: prevState.poll, totalVotes: prevState.totalVotes + 1 }
        });
    }

    roomStarting() {
        console.log('room started successfully (non-owner)');
        this.setState({ started: true });
    }

    timerUpdate(data) {
        const { time } = data;
        this.setState({ timer: time });
    }

    handleChange(e) {
        this.setState({ pollItem: e.target.value });
    }

    validate(e) {
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            e.preventDefault();
            this.setState({ formSubmitted: true });
            if (!this.context.user.roomId)
                listenContinueRoom(this.continueRoomUpdate);
            sendPollUpdate(this.state.pollItem, this.context.user.roomId ? this.context.user.roomId : this.state.id);
        }

        this.setState({ validated: true });
    }

    onPollSubmit(pollItem) {
        this.setState({ formSubmitted: true, pollItem: pollItem });
        if (!this.context.user.roomId)
            listenContinueRoom(this.continueRoomUpdate);
        sendPollUpdate(pollItem, this.context.user.roomId ? this.context.user.roomId : this.state.id);
    }

    handleContinueRoom(status) {
        continueRoom({ status: status, roomId: this.context.user.roomId }, this.continueRoomUpdate);
    }

    continueRoomUpdate(data) {
        const { status, currMaxItem, votes } = data;
        if (status === 'found-winner') {
            console.log('poll winner was found');
            axios.post(content.api + '/request-yt', { search: currMaxItem + ' karaoke' })
                .then(res => {
                    console.log(res);
                    if (res.status === 200)
                        this.setState({ videoId: res.data.videoId });
                }).catch(err => {
                    console.error(err);
                })
            this.setState({ foundWinner: true, currMaxItem: { name: currMaxItem, votes: votes } });
        } else if (status === 'poll-reset') {
            console.log('resetting...');
            this.setState({ validated: false, foundWinner: false, currMaxItem: {}, videoId: '', poll: {}, totalVotes: 0, pollItem: null, formSubmitted: false, timer: 30 });
        }
    }

    leaveRoom() {
        this.setState({ exiting: true });
    }

    onRoomLeave() {
        this.setState({ confirmExit: true });
        leaveRoom(this.context.user.roomId ? true : false, this.context.user.roomId ? this.context.user.roomId : this.state.id);
    }

    onRoomLeaveCancel() {
        this.setState({ exiting: false });
    }

    render() {
        return (
            <UserContext.Consumer>
                {
                    ({ user, updateProp }) => {
                        if ((this.state.exiting && this.state.confirmExit) || _.isEmpty(user)) {
                            if (!(this.state.exiting && this.state.confirmExit) && this.props.isJoining)
                                return <Redirect to={`/${this.state.id}`} />
                            return <Redirect to="/" />
                        }

                        if (this.state.foundWinner) {
                            return (
                                <div className="yt-room-container container-fluid text-center">
                                    {
                                        this.state.exiting && !this.state.confirmExit &&
                                        <WarningModal isOwner={this.context.user.roomId ? true : false} onLeave={this.onRoomLeave} onCancel={this.onRoomLeaveCancel} />
                                    }
                                    <MediaQuery maxWidth={767}>
                                        <div className="w-100">
                                            <Button className="leave-room-btn mx-auto my-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                        </div>
                                    </MediaQuery>
                                    <h3>
                                        {
                                            this.state.currMaxItem.votes === -1 ? `The Poll Winner is "${this.state.currMaxItem.name}" by random!` :
                                                `The Poll Winner is "${this.state.currMaxItem.name}" with ${this.state.currMaxItem.votes} votes!`
                                        }
                                    </h3>
                                    <MediaQuery maxWidth={767}>
                                        <ReactPlayer className="my-0 mx-auto" url={`https://www.youtube.com/watch?v=${this.state.videoId}`} width="360px" height="240px" controls />
                                    </MediaQuery>
                                    <MediaQuery minWidth={768}>
                                        <ReactPlayer className="my-0 mx-auto" url={`https://www.youtube.com/watch?v=${this.state.videoId}`} width="640px" height="480px" controls />
                                    </MediaQuery>
                                    <Button className="m-5" onClick={(e) => { this.handleContinueRoom('poll-reset') }} variant="primary">Continue</Button>
                                    <MediaQuery minWidth={768}>
                                        <Button className="leave-room-btn m-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                    </MediaQuery>
                                </div>
                            );
                        }

                        if (this.state.started) {
                            return (
                                <div className="room-container container-fluid text-center">
                                    {
                                        this.state.exiting && !this.state.confirmExit &&
                                        <WarningModal isOwner={this.context.user.roomId ? true : false} onLeave={this.onRoomLeave} onCancel={this.onRoomLeaveCancel} />
                                    }
                                    <CircularProgressbar styles={{ text: { fontSize: '1.5rem' } }} strokeWidth={12} className="timer mx-3 my-2" value={this.state.timer / 30} maxValue={1} text={`${this.state.timer} s`}></CircularProgressbar>
                                    <MediaQuery maxWidth={767}>
                                        <div className="w-100">
                                            <Button className="leave-room-btn mx-auto my-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                            <Button className="toggle-rp-btn m-3" variant="outline-secondary" onClick={this.toggleRoomPars}><PeopleFill /></Button>
                                        </div>
                                        <RoomParList roomPars={this.state.roomPars} toggleRoomPars={this.toggleRoomPars} style={{ transform: this.state.showRoomPars ? "translateX(0)" : "translateX(100%)" }} />
                                    </MediaQuery>
                                    <div className="row">
                                        <div className="col">
                                            <h1 className="mt-3 mb-5">Hey {user.nickname}! We're polling!</h1>
                                            <div className="poll-wrapper">
                                                {
                                                    (this.state.timer !== 0 && !this.state.formSubmitted) &&
                                                    <Form className="poll-form" noValidate validated={this.state.validated} onSubmit={this.validate}>
                                                        <Form.Group className="text-left">
                                                            <Form.Label>New Poll Item</Form.Label>
                                                            <InputGroup className="mb-3">
                                                                <FormControl value={this.state.pollItem} type="text" placeholder="Enter a poll item" onChange={this.handleChange} required />
                                                                <InputGroup.Append>
                                                                    <Button variant="outline-secondary" type="submit"><Plus /></Button>
                                                                </InputGroup.Append>
                                                                <Form.Control.Feedback type="invalid">
                                                                    Please enter something to be polled.
                                                                </Form.Control.Feedback>
                                                            </InputGroup>
                                                        </Form.Group>
                                                    </Form>
                                                }
                                                {
                                                    (this.state.timer === 0 || this.state.formSubmitted) ? <PollResultsList poll={this.state.poll} totalVotes={this.state.totalVotes} /> :
                                                        <Poller poll={this.state.poll} selected={this.state.pollItem} showResults={this.state.formSubmitted} onSubmit={this.onPollSubmit} />
                                                }
                                                {
                                                    (this.state.timer === 0 || this.state.totalVotes === this.state.roomPars.length) && user.roomId &&
                                                    <Button onClick={(e) => { this.state.totalVotes ? this.handleContinueRoom('poll-finished') : this.handleContinueRoom('poll-reset') }} variant="primary">Continue</Button>
                                                }
                                            </div>
                                        </div>
                                        <MediaQuery minWidth={768}>
                                            <div className="col-sm-auto room-list-wrapper">
                                                <RoomParList roomPars={this.state.roomPars} />
                                            </div>
                                        </MediaQuery>
                                    </div>
                                    <MediaQuery minWidth={768}>

                                        <Button className="leave-room-btn m-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                    </MediaQuery>
                                </div>
                            );
                        }

                        if (this.props.isJoining) {
                            if (this.state.joined) {
                                return (
                                    <div className="room-container container-fluid text-center">
                                        {
                                            this.state.exiting && !this.state.confirmExit &&
                                            <WarningModal isOwner={this.context.user.roomId ? true : false} onLeave={this.onRoomLeave} onCancel={this.onRoomLeaveCancel} />
                                        }
                                        <MediaQuery maxWidth={767}>
                                            <div className="w-100">
                                                <Button className="leave-room-btn mx-auto my-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                                <Button className="toggle-rp-btn m-3" variant="outline-secondary" onClick={this.toggleRoomPars}><PeopleFill /></Button>
                                            </div>
                                            <RoomParList roomPars={this.state.roomPars} toggleRoomPars={this.toggleRoomPars} style={{ transform: this.state.showRoomPars ? "translateX(0)" : "translateX(100%)" }} />
                                            <div className="room-info-wrapper">
                                                <h1 className="mb-5">Hey {user.nickname}! Welcome to the room (id: {this.state.id})</h1>
                                                <h3>Waiting for room owner to start</h3>
                                                <BeatLoader css={override} color={"#36D7B7"} loading={true} />
                                            </div>
                                        </MediaQuery>
                                        <MediaQuery minWidth={768}>
                                            <div className="row">
                                                <div className="col room-info-container">
                                                    <div className="room-info-wrapper">
                                                        <h1 className="mb-5">Hey {user.nickname}! Welcome to the room (id: {this.state.id})</h1>
                                                        <h3>Waiting for room owner to start</h3>
                                                        <BeatLoader css={override} color={"#36D7B7"} loading={true} />
                                                    </div>
                                                </div>
                                                <div className="col-sm-auto room-list-wrapper">
                                                    <RoomParList roomPars={this.state.roomPars} />
                                                </div>
                                            </div>
                                            <Button className="leave-room-btn m-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                        </MediaQuery>
                                    </div>
                                );
                            } else {
                                if (user.profile && !this.state.profResolved) {
                                    console.log('hi profile has been resolved')
                                    joinRoom(this.state.id, user, this.joinRoomSuccess, this.joinRoomError, this.joinRoomUpdate);
                                    this.setState({ profResolved: true });
                                }

                                return (
                                    <div className="room-container py-5 text-center">
                                        <div>
                                            <h1>Joining room (id: {this.state.id})</h1>
                                            <BeatLoader css={override} color={"#36D7B7"} loading={true} />
                                        </div>
                                    </div>
                                );
                            }
                        } else {
                            return (
                                <div className="room-container container-fluid text-center">
                                    {
                                        this.state.exiting && !this.state.confirmExit &&
                                        <WarningModal isOwner={this.context.user.roomId ? true : false} onLeave={this.onRoomLeave} onCancel={this.onRoomLeaveCancel} />
                                    }
                                    <MediaQuery maxWidth={767}>
                                        <div className="w-100">
                                            <Button className="leave-room-btn mx-auto my-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                            <Button className="toggle-rp-btn m-3" variant="outline-secondary" onClick={this.toggleRoomPars}><PeopleFill /></Button>
                                        </div>
                                        <RoomParList roomPars={this.state.roomPars} toggleRoomPars={this.toggleRoomPars} style={{ transform: this.state.showRoomPars ? "translateX(0)" : "translateX(100%)" }} />
                                        <div className="room-info-wrapper">
                                            <h1>Hey {user.nickname}! Welcome to your room (id: {user.roomId})</h1>
                                            {
                                                this.state.qrCodeUrl &&
                                                <div className="qr-code-wrapper">
                                                    <img className="qr-code" src={this.state.qrCodeUrl} />
                                                    <p>Scan this to join the room.</p>
                                                </div>
                                            }
                                            <Button variant="primary" onClick={this.startPollKar}>Start Poll Kar</Button>
                                        </div>
                                    </MediaQuery>
                                    <MediaQuery minWidth={768}>
                                        <div className="row">
                                            <div className="col room-info-container">
                                                <div className="room-info-wrapper">
                                                    <h1>Hey {user.nickname}! Welcome to your room (id: {user.roomId})</h1>
                                                    {
                                                        this.state.qrCodeUrl &&
                                                        <div className="qr-code-wrapper">
                                                            <img className="qr-code" src={this.state.qrCodeUrl} />
                                                            <p>Scan this to join the room.</p>
                                                        </div>
                                                    }
                                                    <Button variant="primary" onClick={this.startPollKar}>Start Poll Kar</Button>
                                                </div>
                                            </div>
                                            <div className="col-sm-auto room-list-wrapper">
                                                <RoomParList roomPars={this.state.roomPars} />
                                            </div>
                                        </div>
                                        <Button className="leave-room-btn m-3" variant="danger" onClick={this.leaveRoom}>Leave Room</Button>
                                    </MediaQuery>
                                </div>
                            );
                        }
                    }
                }
            </UserContext.Consumer>
        );
    }
}

export default Room;