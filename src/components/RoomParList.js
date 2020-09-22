import React from 'react';
import '../css/RoomParList.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { X } from 'react-bootstrap-icons';
import content from '../static.json';
import MediaQuery from 'react-responsive';


class RoomParList extends React.Component {
    constructor(props) {
        super(props);

        this.state = { transImage: false };
        this.imgRef = React.createRef(); 
    }

    render() {
        return (
            <div className="room-list-container px-4 py-3" style={this.props.style}>
                <MediaQuery maxWidth={767}>
                    <div className="d-inline-block" onClick={this.props.toggleRoomPars}><X /></div>
                </MediaQuery>
                <h5>Users in Room <Badge variant="secondary">{this.props.roomPars.length}</Badge></h5>
                <ul>
                    {
                        this.props.roomPars.map(v =>
                            <li className="mb-2">
                                <div className="rl-title-bar">
                                    <div className="rl-img-crop-circle mx-3">
                                        <img src={content.api + v.profile} className={this.state.transImage ? "rl-trans-img" : ""} ref={this.imgRef} onLoad={() => { if (this.imgRef.current.naturalHeight < this.imgRef.current.naturalWidth) this.setState({transImage: true}); }} />
                                    </div>
                                    <span className="d-inline-block">{v.nickname}</span>
                                </div>
                            </li>
                        )
                    }
                </ul>
            </div>
        );
    }
}

export default RoomParList;