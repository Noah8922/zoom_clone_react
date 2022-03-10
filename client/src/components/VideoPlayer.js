import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { history } from "../redux/configureStore";
import cors from "cors";

//Style
import styled from "styled-components";

const Videoplayer = (props) => {
  const roomName = props.match.params.roomName;
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [Audio, setAduio] = useState([]);
  const [Video, setVideo] = useState([]);

  const videoGrid = useRef();
  const muteBtn = useRef();
  const cameraBtn = useRef();
  const leaveBtn = useRef();
  const cameraSelect = useRef();
  const call = useRef();
  const mystream = useRef();
  const myVideo = useRef();
  const peerVideo = useRef();

  let myPeerConnection;
  let myStream;
  let nickname = "noah";
  let pcObj = {};
  let peopleInRoom = 1;

  const socket = io("https://test.kimjeongho-server.com", {
    cors: { origin: "*" },
  }); //Server adress

  useEffect(() => {
    //페이지가 마운트된 후에 "join_room" Event 발생 1
    socket.emit("join_room", roomName, nickname);
  }, []);
  socket.on("accept_join", async (userObjArr) => {
    await getMedia();

    const length = userObjArr.length;

    if (length === 1) {
      return;
    }

    for (let i = 0; i < length - 1; i++) {
      try {
        const newPC = makeConnection(
          userObjArr[i].socketId,
          userObjArr[i].nickname
        );
        const offer = await newPC.createOffer(); // 각 연결들에 대해 offer를 생성
        await newPC.setLocalDescription(offer);
        socket.emit("offer", offer, userObjArr[i].socketId, nickname); // offer를 받을 socket id와 보내는 사람의 닉네임
      } catch (error) {
        console.log(error);
      }
    }
  });

  async function getMedia(deviceId) {
    const initialConstraints = {
      audio: true,
      video: { facingMode: "user" },
    };
    const cameraConstraints = {
      audio: true,
      video: { deviceId: { exact: deviceId } },
    };
    try {
      myStream = await navigator.mediaDevices.getUserMedia(
        deviceId ? cameraConstraints : initialConstraints
      );
      addVideoStream(myVideo.current, myStream);
      videoGrid.current.append(myVideo.current);
      setAduio(myStream.getAudioTracks());
      setVideo(myStream.getVideoTracks());
      if (!deviceId) {
        await getCameras();
      }
    } catch (error) {
      console.log(error);
    }
  }

  // 영상 스트림을 DOM 비디오 엘리먼트에 넣어주는 함수
  async function addVideoStream(video, stream) {
    try {
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
    } catch (error) {
      console.log(error);
    }
  }

  function makeConnection(remoteSocketId, remoteNickname) {
    // myPeerConnection = new RTCPeerConnection();
    myPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
          ],
        },
      ],
    });

    myPeerConnection.addEventListener("icecandidate", (event) => {
      handleIce(event, remoteSocketId);
    });

    myPeerConnection.addEventListener("track", (data) => {
      // console.log(event);
      // const data = event.streams[0];
      handleAddStream(data, remoteSocketId, remoteNickname);
    });

    myStream
      .getTracks()
      .forEach((track) => myPeerConnection.addTrack(track, myStream));

    // pcObj에 각 사용자와의 connection 정보를 저장함
    pcObj[remoteSocketId] = myPeerConnection;

    peopleInRoom++;

    return myPeerConnection;
  }

  function handleAddStream(event, remoteSocketId, remoteNickname) {
    const peerStream = event.streams[0];
    if (event.track.kind === "video") {
      paintPeerFace(peerStream, remoteSocketId, remoteNickname);
    }
  }

  async function paintPeerFace(peerStream, id, remoteNickname) {
    try {
      const videoGrid = document.querySelector("#video-grid");
      const video = document.createElement("video");
      video.id = "video1";
      video.autoplay = true;
      video.playsInline = true;
      video.width = "400";
      video.height = "400";
      // const peerFace = document.getElementById("video1");
      video.srcObject = peerStream;

      // div.appendChild(video);
      videoGrid.appendChild(video);
    } catch (error) {
      console.log(error);
    }
  }

  socket.on("offer", async (offer, remoteSocketId, remoteNickname) => {
    try {
      const newPC = makeConnection(remoteSocketId, remoteNickname);
      await newPC.setRemoteDescription(offer);
      const answer = await newPC.createAnswer();
      await newPC.setLocalDescription(answer);
      socket.emit("answer", answer, remoteSocketId);
      console.log(remoteSocketId);
    } catch (error) {
      console.log(error);
    }
  });

  //방 만든 브라우저에서 일어나는 일 (참가한 방에서 보낸 answer을 받아 저장함.)
  socket.on("answer", async (answer, remoteSocketId) => {
    await pcObj[remoteSocketId].setRemoteDescription(answer);
  });

  function handleIce(event, remoteSocketId) {
    if (event.candidate) {
      socket.emit("ice", event.candidate, remoteSocketId);
    }
  }

  socket.on("ice", async (ice, remoteSocketId) => {
    await pcObj[remoteSocketId].addIceCandidate(ice);
  });

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
    } catch (error) {
      console.log(error);
    }
  }

  // 이후 참가한 방에 일어나는 일

  socket.on("rejectJoin", () => {
    alert("정원이 초과되었습니다.");
    history.replace("/");
    window.location.reload();
  });

  //////////////////////////////////////

  async function handleMuteClick() {
    Audio.forEach((track) => (track.enabled = !track.enabled));
    try {
      if (muted === false) {
        setMuted(true);
      } else if (muted === true) {
        setMuted(false);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function handleCameraClick() {
    Video.forEach((track) => (track.enabled = !track.enabled));
    try {
      if (cameraOff === false) {
        setCameraOff(true);
      } else if (cameraOff === true) {
        setCameraOff(false);
      }
    } catch (error) {
      console.log(error);
    }
  }
  //나가기를 누르면 나한테 벌어지는 일
  function LeaveRoom() {
    socket.disconnect();

    console.log("방을 나갈때 나한테 일어나는 일");
    history.replace("/");
    window.location.reload();

    pcObj = {};
    peopleInRoom = 1;
    nickname = "";

    // html 요소만 숨기는 것이 아니라 싹 지워지도록
    myStream.getTracks().forEach((track) => track.stop());

    const myvideo = document.getElementById("#myvideo");
    myvideo.srcObject = null;
    clearAllVideos();
  }

  function clearAllVideos() {
    const streams = document.querySelector("#video-grid");
    const streamArr = streams.querySelectorAll("video");
    streamArr.forEach((streamElement) => {
      if (streamElement.id !== "myStream") {
        streams.removeChild(streamElement);
      }
    });
  }

  //내가 나갈때 다른 사람들에게 일어나는 일
  socket.on("leave_room", (leavedSocketId) => {
    console.log(leavedSocketId);
    removeVideo(leavedSocketId);
  });

  function removeVideo(leavedSocketId) {
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
      if (streamElement.id === leavedSocketId) {
        streams.removeChild(streamElement);
      }
    });
  }

  return (
    <>
      <div ref={call}>
        <div ref={videoGrid} id="video-grid">
          <video ref={myVideo} autoPlay playsInline id="myvideo"></video>
        </div>
        <div id="controller">
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
    </>
  );
};

export default Videoplayer;
