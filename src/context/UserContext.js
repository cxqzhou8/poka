import React from 'react';

const UserContext = React.createContext({user: {}, updateProp: () => {}});
export default UserContext;