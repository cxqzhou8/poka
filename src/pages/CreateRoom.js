import React from 'react';
import '../css/CreateRoom.css';
import UserContext from '../context/UserContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import content from '../static.json';
import { Redirect } from 'react-router-dom';
import MediaQuery from 'react-responsive';

class CreateRoom extends React.Component {
    static contextType = UserContext;
    constructor(props) {
        super(props);

        this.state = { id: null, validated: false, joining: false, creating: false, transImage: false };
        this.handleChange = this.handleChange.bind(this);
        this.joinExistingRoom = this.joinExistingRoom.bind(this);
        this.createRoom = this.createRoom.bind(this);

        this.imgRef = React.createRef();
    }

    handleChange(e) {
        this.setState({ id: e.target.value });
    }

    joinExistingRoom(e) {
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            e.preventDefault();

            this.setState({ joining: true });
        }

        this.setState({ validated: true });
    }

    createRoom() {
        axios.post(content.api + '/create-room')
            .then(res => {
                console.log(res);
                if (res.status === 200) {
                    this.context.updateProp('roomId', res.data.id);
                    this.setState({ id: res.data.id, creating: true });
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    render() {
        return (
            <UserContext.Consumer>
                {
                    ({ user, updateProp }) => {
                        if (!user.nickname)
                            return <Redirect to="/" />
                        if (this.state.joining) {
                            return <Redirect to={"/room/" + this.state.id + "/join"} />
                        } else if (this.state.creating) {
                            return <Redirect to={"/room/" + this.state.id} />
                        } else {
                            return (
                                <div className="p-3 text-center container-fluid">
                                    <MediaQuery maxWidth={767}>
                                        <OverlayTrigger placement="right" delay={{ show: 250, hide: 250 }} overlay={<Tooltip>{user.profAlias}</Tooltip>}>
                                            <div className="img-crop-circle mx-3">
                                                <img src={content.api + user.profile} className={this.state.transImage ? "trans-img" : ""} ref={this.imgRef} onLoad={() => { if (this.imgRef.current.naturalHeight < this.imgRef.current.naturalWidth) this.setState({transImage: true}); }} />
                                            </div>
                                        </OverlayTrigger>
                                        <h2>Hey {user.nickname}! Let's get started!</h2>
                                        <div className="my-5">
                                            <h3 className="mb-3">Create</h3>
                                            <Button variant="primary" onClick={this.createRoom}>Create a Room</Button>
                                        </div>
                                        <div className="my-5">
                                            <h3 className="mb-3">Join</h3>
                                            <Form id="join-form" className="form-wrapper px-5" noValidate validated={this.state.validated} onSubmit={this.joinExistingRoom}>
                                                <Form.Group>
                                                    <InputGroup className="mb-3">
                                                        <FormControl value={this.state.id} type="text" placeholder="Enter Room ID" pattern="^[0-9]+$" onChange={this.handleChange} required />
                                                        <InputGroup.Append>
                                                            <Button variant="outline-secondary" type="submit">Join</Button>
                                                        </InputGroup.Append>
                                                        <Form.Control.Feedback type="invalid">
                                                            Please enter a valid room ID.
                                                        </Form.Control.Feedback>
                                                    </InputGroup>
                                                </Form.Group>
                                            </Form>
                                        </div>
                                    </MediaQuery>
                                    <MediaQuery minWidth={768}>
                                        <div className="title-bar">
                                            <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 250 }} overlay={<Tooltip>{user.profAlias}</Tooltip>}>
                                                <div className="img-crop-circle mx-3">
                                                    <img src={content.api + user.profile} className={this.state.transImage ? "trans-img" : ""} ref={this.imgRef} onLoad={() => { if (this.imgRef.current.naturalHeight < this.imgRef.current.naturalWidth) this.setState({transImage: true}); }} />
                                                </div>
                                            </OverlayTrigger>
                                            <h1 className="d-inline-block">Hey {user.nickname}! Let's get started!</h1>
                                        </div>
                                        <div className="row mt-5">
                                            <div className="col">
                                                <h3 className="mb-3">Create</h3>
                                                <Button variant="primary" onClick={this.createRoom}>Create a Room</Button>
                                            </div>
                                            <div className="col">
                                                <h3 className="mb-3">Join</h3>
                                                <Form id="join-form" className="form-wrapper px-5" noValidate validated={this.state.validated} onSubmit={this.joinExistingRoom}>
                                                    <Form.Group>
                                                        <InputGroup className="mb-3">
                                                            <FormControl value={this.state.id} type="text" placeholder="Enter Room ID" pattern="^[0-9]+$" onChange={this.handleChange} required />
                                                            <InputGroup.Append>
                                                                <Button variant="outline-secondary" type="submit">Join</Button>
                                                            </InputGroup.Append>
                                                            <Form.Control.Feedback type="invalid">
                                                                Please enter a valid room ID.
                                                        </Form.Control.Feedback>
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Form>
                                            </div>
                                        </div>
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

export default CreateRoom;