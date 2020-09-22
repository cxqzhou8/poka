import React from 'react';
import PollResultsItem from './PollResultsItem';

class PollResultsList extends React.Component {
    render() {
        let elements = [];

        console.log(this.props.poll);
        for (const key in this.props.poll) {
            elements.push(
                <PollResultsItem item={key} percent={Math.round(((this.props.poll[key] / this.props.totalVotes) + Number.EPSILON) * 100)} />
            );
        }

        return (
            <div>
                <h3>Poll Results</h3>
                {elements}
                {
                    !elements.length &&
                    <h4>No one voted!</h4>
                }
            </div>
        );
    }
}

export default PollResultsList;