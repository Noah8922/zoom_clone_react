import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import { history } from "../redux/configureStore";

//Style
import styled from "styled-components";

const Videoplayer = (props) => {
  const roomId = props.match.params.roomName;
  const [me, setMe] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [audio, setAudio] = useState([]);
  const [video, setVideo] = useState([]);

  const videoGrid = useRef();
  const myVideo = useRef();
  const muteBtn = useRef();
  const cameraBtn = useRef();
  const leaveBtn = useRef();
  const cameraSelect = useRef();
  const call = useRef();
  const mystream = useRef();

  let myStream;
  let myPeerConnection;

  const socket = io("http://localhost:5000"); //Server adress

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myStream = stream;
        let streamId = stream.id;
        console.log(myStream, streamId);
        socket.emit("join-room", roomId);
        addVideoStream(myVideo.current, stream);
        videoGrid.current.append(myVideo.current);
        getCameras();
        makeConnection();
      });
  }, []);

  async function getCameras() {
    try {
      const devieces = await navigator.mediaDevices.enumerateDevices();
      const cameras = devieces.filter((device) => device.kind === "videoinput");
      console.log(cameras[0].deviceId);
      cameras.forEach((camera) => {
        const option = document.createElement("option");
        option.value = cameras[0].deviceId;
        option.innerText = camera.label;
        cameraSelect.current.append(option);
      });
    } catch (e) {
      console.log(e);
    }
  }

  function makeConnection() {
    myPeerConnection = new RTCPeerConnection(); //peer to pper connection
    setAudio(myStream.getTracks().filter((track) => track.kind === "audio"));
    setVideo(myStream.getTracks().filter((track) => track.kind === "video"));
    myStream
      .getTracks()
      .forEach((track) => myPeerConnection.addTrack(track, myStream));
    console.log(myPeerConnection);
    socket.on("welcome", () => {
      console.log("someone joined");
    });
  }

  function handleMuteClick() {
    audio.forEach((track) => (track.enabled = !track.enabled));
    if (muted === false) {
      setMuted(true);
      return;
    } else if (muted === true) {
      setMuted(false);
      return;
    }
  }

  function handleCameraClick() {
    video.forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff === false) {
      setCameraOff(true);
      return;
    } else if (cameraOff === true) {
      setCameraOff(false);
      return;
    }
  }

  function LeaveRoom() {
    history.push("/");
    window.location.reload();
  }

  return (
    <>
      <div ref={call}>
        <div ref={mystream}>
          <div ref={videoGrid} id="video-grid">
            <video ref={myVideo} autoPlay playsInline></video>
          </div>
          <div>
            <button ref={muteBtn} onClick={handleMuteClick}>
              mute
            </button>
            <button ref={cameraBtn} onClick={handleCameraClick}>
              camera
            </button>
            <button ref={leaveBtn} onClick={LeaveRoom}>
              leave
            </button>
            <select ref={cameraSelect}></select>
          </div>
        </div>
      </div>
    </>
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
