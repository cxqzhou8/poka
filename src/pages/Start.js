import React from 'react';
import UserContext from '../context/UserContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/Start.scss';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import { Redirect } from 'react-router-dom';
import content from '../static.json';

class Start extends React.Component {
    static contextType = UserContext;
    constructor(props) {
        super(props);

        // let nickname = ""
        // axios.post('http://localhost:3000/get-nickname')
        //     .then(res => {
        //         console.log(res);
        //         if (res.status === 200) {
        //             nickname = res.data.nickname;
        //             this.setState({ auth: true });
        //         }
        //     })
        //     .catch(err => {
        //         console.log(err);
        //         nickname = "";
        //     });

        this.state = { nickname: '', auth: false, validated: false };

        this.createNickname = this.createNickname.bind(this)
        this.handleChange = this.handleChange.bind(this);
    }

    createNickname(e) {
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            e.preventDefault();

            const user = { nickname: this.state.nickname };
            this.context.updateProp('nickname', user.nickname);

            axios.post(`${content.api}/create-nickname`, { user })
                .then(res => {
                    console.log(res)
                    console.log(res.data)

                    if (res.status === 200) {
                        this.context.updateProp('profile', res.data.profile);
                        this.context.updateProp('profAlias', res.data.profAlias);
                        this.setState({ auth: true });
                    }
                })
                .catch(err => {
                    console.error(err);
                });
        }

        this.setState({ validated: true });
    }

    handleChange(e) {
        this.setState({ nickname: e.target.value });
    }


    render() {
        return (
            <UserContext.Consumer>
                {
                    ({ user, updateProp }) => {
                        if (user.nickname) {
                            return <Redirect to='/create-room' />;
                        } else {
                            return (
                                <div className="start-container text-center">
                                    <h1>Poll Karaoke</h1>
                                    <Form noValidate validated={this.state.validated} className="name-wrapper py-5 text-left" onSubmit={this.createNickname}>
                                        <Form.Group controlId="validationCustom01">
                                            <Form.Label>Nickname</Form.Label>
                                            <InputGroup className="mb-3">
                                                <FormControl value={this.state.nickname} type="text" placeholder="Enter Nickname" onChange={this.handleChange} required />
                                                <InputGroup.Append>
                                                    <Button variant="outline-secondary" type="submit">Continue</Button>
                                                </InputGroup.Append>
                                                <Form.Control.Feedback type="invalid">
                                                    Please enter a nickname.
                                                </Form.Control.Feedback>
                                            </InputGroup>

                                            {/* <Form.Control value={this.state.nickname} onChange={this.handleChange} type="text" placeholder="Enter Nickname" required /> */}
                                        </Form.Group>
                                        {/* <Button className="text-center" variant="primary" type="submit">Continue</Button> */}
                                    </Form>
                                </div>
                            );
                        }
                    }
                }
            </UserContext.Consumer>
        );
    }
}

export default Start;