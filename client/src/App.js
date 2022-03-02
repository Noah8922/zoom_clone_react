import React from "react";
import { Typography, AppBar } from "@material-ui/core";

//import component
import Videoplayer from "./components/VideoPlayer";
import Options from "./components/Options";
import Notification from "./components/Notification";

const App = () => {
  return (
    <div>
      <AppBar position="static" color="inherit">
        <Typography variant="h2" align="center">
          Video Chat
        </Typography>
      </AppBar>
      <Videoplayer />
      <Options>
        <Notification />
      </Options>
    </div>
  );
};

export default App;
