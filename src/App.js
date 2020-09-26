import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import './css/App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Start from './pages/Start'
import Room from './pages/Room'
import CreateRoom from './pages/CreateRoom';
import UserContext from './context/UserContext';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.updateProp = (prop, value) => {
      this.setState(prevState => {
        let user = prevState.user;
        user[prop] = value;
        return { user: user };
      });
    }

    // this.updateNickname = (name) => {
    //   this.setState(prevState => ({
    //     user: {
    //       ...prevState.user,
    //       nickname: name
    //     }
    //   }))
    // };

    // this.updateRoomId = (id) => {
    //   this.setState(prevState => ({
    //     user: {
    //       ...prevState.user,
    //       roomId: id
    //     }
    //   }))
    // };

    this.state = { user: {}, updateProp: this.updateProp };
    // { user: {}, updateNickname: this.updateNickname, updateRoomId: this.updateRoomId };
  }

  componentDidMount() {
    // axios.post('/get-user')
    //   .then(res => {
    //     console.log(`updating user details:`);
    //     this.setState({ user: res.data.user });
    //     console.log(this.state.user);
    //   })
    //   .catch(err => {
    //     console.error(err);
    //   });
  }

  render() {
    return (
      <Router>
        <UserContext.Provider value={this.state}>
          <Switch>
            <Route path="/room/:id/join" render={(props) => (<Room {...props} isJoining={true} />)} />
            <Route path="/room/:id" component={Room} />
            <Route path="/create-room" component={CreateRoom} />
            <Route path="/:id" render={(props) => (<Start {...props} isJoining={true} />)} />
            <Route path="/" component={Start} />
          </Switch>
        </UserContext.Provider>
      </Router>
    );
  }
}

export default App;
