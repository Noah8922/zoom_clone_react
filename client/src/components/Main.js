import React, { useState, useEffect, useRef } from "react";
import { history } from "../redux/configureStore";

const Main = () => {
  const [roomName, setRoomName] = useState("");

  function getInRoom() {
    history.push(`/video/${roomName}`);
    window.location.reload();
  }

  return (
    <div>
      <h1 style={{ color: "white" }}>Room Name</h1>
      <input
        onChange={(e) => setRoomName(e.target.value)}
        type="text"
        placeholder="typethe room name"
        required
      ></input>
      <button onClick={getInRoom}>Enter</button>
    </div>
  );
};

export default Main;
