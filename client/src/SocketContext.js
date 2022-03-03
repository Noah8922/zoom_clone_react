//Put all the socket logic in this file in order to make it easier to understand (23:50)

import React, { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();

const socket = io("http://localhost:5000"); //place for server url, 여기서 아마 socket이 연결되어있다는 것을 감지하는 듯.

//we will put lots of state for everything necessary to run our video chat
//Here is all the logic that we need for our video chat

const ContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  //As soon as page mounted, we wnat to get permission to access the camera and audio of user.
  //in this situation we use navigator.mediaDevices.getUserMedia

  //////////////////////////////////////////////////////////////////////////
  // 페이지가 처음 렌더링되고 마운트 되면 실행되게 될 것들 유저로부터 카메라 및 오디오 허가를 받아오는 것.
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;
      });

    socket.on("me", (id) => setMe(id)); //서버로 부터 받는 것
    console.log(me);

    socket.on("calluser", ({ from, name: callerName, signal }) => {
      setCall({ isReceivedCall: true, from, name: callerName, signal });
    });
    console.log(call);
  }, []);

  //////////////////////////////////////////////////////////////////////////////
  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream }); //Not initiate the call just answering

    //signal은 어디서 오는 걸까
    peer.on("signal", (data) => {
      console.log(data);
      socket.emit("answercall", { signal: data, to: call.from }); //to:누구전화를 받는 것이냐
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  //////////////////////////////////////////////////////////////////////////////

  const callUser = (id) => {
    console.log(id);
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      console.log(data);
      socket.emit("calluser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
      console.log(me);
    });

    peer.on("stream", (currentStream) => {
      console.log(currentStream);
      userVideo.current.srcObject = currentStream;
    });

    socket.on("callaccepted", (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  ////////////////////////////////////////////////////////////////////////////////
  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        me,
        callUser,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
