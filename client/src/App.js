import React from "react";
import { Switch, Route } from "react-router-dom";

//import component
import Videoplayer from "./components/VideoPlayer";
import Main from "./components/Main";

const App = () => {
  return (
    <Switch>
      <Route path="/" exact component={Main} />
      <Route path="/video" exact component={Videoplayer} />
    </Switch>
  );
};

export default App;
