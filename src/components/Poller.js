import React from 'react';
import '../css/Poll.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import FormCheck from 'react-bootstrap/FormCheck';
import Feedback from 'react-bootstrap/Feedback';
import Button from 'react-bootstrap/Button';

class Poller extends React.Component {
    constructor(props) {
        super(props);

        this.setRadioValue = this.setRadioValue.bind(this);
        this.props.onSubmit = this.props.onSubmit.bind(this);
        this.validate = this.validate.bind(this);
        this.state = { radioValue: this.props.selected, validated: false };
    }

    setRadioValue(e) {
        console.log(`new radio btn change ${e.currentTarget.value}`);
        this.setState({ radioValue: e.currentTarget.value });
    }

    validate(e) {
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            e.preventDefault();
            this.props.onSubmit(this.state.radioValue);
        }

        this.setState({ validated: true });
    }

    render() {
        if (!(Object.keys(this.props.poll).length === 0 && this.props.poll.constructor === Object)) {
            let items = [];

            for (const key in this.props.poll) {
                items.push(
                        <FormCheck>
                            <FormCheck.Input type="radio" name="poll" value={key} onChange={this.setRadioValue} required />
                            <FormCheck.Label>{key}</FormCheck.Label>
                            <Feedback type="invalid">Please select a poll option.</Feedback>
                        </FormCheck>
                );
            }

            return (
                <div className="text-left d-inline-block">
                    <h3>Poll Items</h3>
                    <Form id="poll-form" className="my-3" noValidate validated={this.state.validated} onSubmit={this.validate}>
                        <Form.Group>
                            {items}
                        </Form.Group>
                    </Form>
                    {!this.props.showResults &&
                        <Button form="poll-form" type="submit" variant="primary">Vote</Button>
                    }
                </div>
            );
        } else {
            return <h1>Start adding items!</h1>
        }
    }
}

export default Poller;