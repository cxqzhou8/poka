import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

class WarningModal extends React.Component {
    constructor(props) {
        super(props);

        this.onLeave = this.onLeave.bind(this);
        this.onCancel = this.onCancel.bind(this);

        this.state = { show: true };
    }

    onLeave() {
        this.setState({ show: false });
        this.props.onLeave();
    }

    onCancel() {
        this.setState({ show: false });
        this.props.onCancel();
    }

    render() {
        return (
            <Modal show={this.state.show} backdrop="static" keyboard={false}>
                <Modal.Body>
                    Are you sure you want to leave?
                    {
                        this.props.isOwner &&
                        ` Leaving will delete this room and kick all users in the room.`
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={this.onLeave}>Leave</Button>
                    <Button variant="secondary" onClick={this.onCancel}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default WarningModal;