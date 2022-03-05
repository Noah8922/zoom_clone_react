import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import { history } from "../redux/configureStore";

//Style
import styled from "styled-components";

const Videoplayer = (props) => {
  const roomName = props.match.params.roomName;
  const [me, setMe] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [audio, setAudio] = useState([]);
  const [video, setVideo] = useState([]);

  const videoGrid = useRef();
  const muteBtn = useRef();
  const cameraBtn = useRef();
  const leaveBtn = useRef();
  const cameraSelect = useRef();
  const call = useRef();
  const mystream = useRef();
  const myVideo = useRef();
  const userstream = useRef();
  const userVidoe = useRef();

  let myStream;
  let myPeerConnection;

  const socket = io("http://localhost:5000"); //Server adress

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        myStream = stream;
        let streamId = stream.id;
        socket.emit("join-room", roomName);
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
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("track", AddStream);
    myStream
      .getTracks()
      .forEach((track) => myPeerConnection.addTrack(track, myStream));
  }

  //방만든 브라우저에서 일어나는 일
  socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    // console.log("sent the offer");
    socket.emit("offer", offer, roomName);
  });

  // 이후 참가한 방에 일어나는 일
  socket.on("offer", async (offer) => {
    // console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    // console.log("sent the answer");
  });

  //방 만든 브라우저에서 일어나는 일 (참가한 방에서 보낸 answer을 받아 저장함.)
  socket.on("answer", (answer) => {
    // console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
  });

  socket.on("ice", async (ice) => {
    // console.log("received candidate");
    await myPeerConnection.addIceCandidate(ice);
  });
  //////////////////////////////////////
  function handleIce(data) {
    // console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
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

  function AddStream(data) {
    // console.log("let's see this is work");
    console.log(data.track);
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
        <div ref={userstream}>
          <div ref={videoGrid} id="video-grid">
            <video ref={userVidoe} autoPlay playsInline></video>
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
