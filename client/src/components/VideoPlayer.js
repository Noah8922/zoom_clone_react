import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";

//Style
import styled from "styled-components";

const Videoplayer = () => {
  const [me, setMe] = useState("");

  const videoGrid = useRef();
  const myVideo = useRef();

  let mystream = null;

  useEffect(() => {
    const socket = io("http://localhost:5000"); //Server adress
    const peer = new Peer();

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        mystream = stream;
        let streamId = stream.id;
        console.log(mystream, streamId);
        addVideoStream(myVideo.current, stream);
        videoGrid.current.append(myVideo.current);
      });
    socket.on("me", (id) => setMe(id));
    console.log(me);
  }, []);

  return (
    <div ref={videoGrid} id="video-grid">
      <video ref={myVideo} autoPlay playsInline></video>
    </div>
  );
};

// 영상 스트림을 DOM 비디오 엘리먼트에 넣어주는 함수
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
}

export default Videoplayer;
