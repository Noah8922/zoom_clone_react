import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import { history } from "../redux/configureStore";

const Main = () => {
  const socket = io("http://localhost:5000"); //Server adress

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
