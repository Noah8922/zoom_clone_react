//Put all the socket login in this file in order to make it easier to understand (23:50)

import React, { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import peer from "simple-peer";

const SocketContext = createContext();

const socket = io("http://localhost:5000"); //place for server url

//we will put lots of state for everything necessary to run our video chat
//Here is all the logic that we need for our video chat

const ContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const myVideo = useRef();

  //As soon as page mounted, we wnat to get permission to access the camera and audio of user.
  //in this situation we use navigator.mediaDevices.getUserMedia

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currnetStream) => {
        setStream(currnetStream);
      });
  });

  const answerCall = () => {};

  const callUser = () => {};

  const leaveCall = () => {};
};
