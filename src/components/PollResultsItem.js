import React from 'react';
import '../css/PollResultsItem.scss';

class PollResultsItem extends React.Component {
    render() {
        const style = {
            width: `${this.props.percent}%`,
            backgroundImage: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)'
        };

        return (
            <div className="item-wrapper my-3">
                <div className="item-progress py-1" style={style}>
                    <h5 className="mx-3 my-0"><span className="font-weight-bold">{this.props.percent}%</span> {this.props.item}</h5>
                </div>
            </div>
        );
    }
}

export default PollResultsItem;