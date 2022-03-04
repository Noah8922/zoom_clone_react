import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

//import component
import Videoplayer from "./components/VideoPlayer";
import Main from "./components/Main";

const App = () => {
  return (
    <Router>
      <Switch>
        {/* <Route path="/" exact component={Main} /> */}
        <Route path="/video" exact component={Videoplayer} />
      </Switch>
    </Router>
  );
};

export default App;
