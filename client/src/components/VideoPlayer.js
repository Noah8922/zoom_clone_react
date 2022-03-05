import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";
import { history } from "../redux/configureStore";

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
  const userstream = useRef();
  const userVidoe = useRef();

  let myPeerConnection;
  let nickname = "noah";
  let pcObj = {};
  let peopleInRoom = 1;
  let myStream;
  let audio = [];
  let video = [];

  const socket = io("http://localhost:5000"); //Server adress

  useEffect(() => {
    getMedia();
  }, []);

  async function getMedia(deviceId) {
    try {
      myStream = await navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          myStream = stream;
          let streamId = stream.id;
          audio = myStream
            .getTracks()
            .filter((track) => track.kind === "audio");
          video = myStream
            .getTracks()
            .filter((track) => track.kind === "video");
          console.log(myStream, streamId); //나의 stream 아이디 : 'CBVoe1ALQKTAWj29G95MvFtetIaXC0pATJpR'
          setAduio(audio);
          setVideo(video);
          addVideoStream(myVideo.current, stream);
          videoGrid.current.append(myVideo.current);
          socket.emit("joinRoom", roomName, nickname);
        });
      if (!deviceId) {
        await getCameras();
      }
    } catch (error) {
      console.log(error);
    }
  }

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

  function paintPeerFace(peerStream, id, remoteNickname) {
    console.log(peerStream);
  }

  function handleIce(data, roomName) {
    if (data.candidate) {
      socket.emit("ice", data.candidate, roomName);
    }
  }

  function AddStream(event, remoteSocketId, remoteNickname) {
    console.log(event);
    const peerStream = event.stream;
    paintPeerFace(peerStream, remoteSocketId, remoteNickname);
  }

  ////////////////////////////////////////////////////////////////////

  socket.on("acceptJoin", async (userObjArr) => {
    console.log(userObjArr);
    const length = userObjArr.length;
    // 나 혼자일 경우는 여기까지 실행
    if (length === 1) {
      return;
    }

    // 기존에 방에 있던 사람들에게 offer를 제공한다.
    for (let i = 0; i < length - 1; i++) {
      try {
        const newPC = makeConnection(
          userObjArr[i].socketId,
          userObjArr[i].nickname
        );
        console.log(newPC);
        const offer = await newPC.createOffer(); // 각 연결들에 대해 offer를 생성
        await newPC.setLocalDescription(offer);
        socket.emit("offer", offer, userObjArr[i].socketId, nickname); // offer를 받을 socket id와 보내는 사람의 닉네임
      } catch (error) {
        console.log(error);
      }
    }
  });

  function makeConnection(remoteSocketId, remoteNickname) {
    const myPeerConnection = new RTCPeerConnection({
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
    myPeerConnection.addEventListener("addstream", (event) => {
      AddStream(event, remoteSocketId, remoteNickname);
    });

    // 내 영상을 myPeerConnection에 올림. 위 listner들보다 위에 위치해도 될까?
    // myStream
    //   .getTracks()
    //   .forEach((track) => myPeerConnection.addTrack(track, myStream));

    Audio.forEach((track) => myPeerConnection.addTrack(track));
    Video.forEach((track) => myPeerConnection.addTrack(track));

    // Audio.forEach((track) => myPeerConnection.addTrack(track, myStream));
    // Video.forEach((track) => myPeerConnection.addTrack(track, myStream));

    // pcObj에 각 사용자와의 connection 정보를 저장함
    pcObj[remoteSocketId] = myPeerConnection;

    peopleInRoom++;

    return myPeerConnection;
  }

  // 이후 참가한 방에 일어나는 일
  socket.on("offer", async (offer, remoteSocketId, remoteNickname) => {
    try {
      const myPeerConnection = makeConnection(remoteSocketId, remoteNickname);
      await myPeerConnection.setRemoteDescription(offer);
      const answer = await myPeerConnection.createAnswer();
      console.log(answer);
      await myPeerConnection.setLocalDescription(answer);
      socket.emit("answer", answer, remoteSocketId);
    } catch (error) {
      console.log(error);
    }
  });

  //방 만든 브라우저에서 일어나는 일 (참가한 방에서 보낸 answer을 받아 저장함.)
  socket.on("answer", async (answer, remoteSocketId) => {
    await pcObj[remoteSocketId].setRemoteDescription(answer);
  });

  socket.on("ice", async (ice, remoteSocketId) => {
    await pcObj[remoteSocketId].addIceCandidate(ice);
  });

  socket.on("rejectJoin", () => {
    alert("정원이 초과되었습니다.");
    history.replace("/");
    window.location.reload();
  });

  //////////////////////////////////////

  function handleMuteClick() {
    console.log(Audio);
    Audio.forEach((track) => (track.enabled = !track.enabled));
    if (muted === false) {
      setMuted(true);
    } else if (muted === true) {
      setMuted(false);
    }
  }

  function handleCameraClick() {
    console.log(Video);
    Video.forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff === false) {
      setCameraOff(true);
    } else if (cameraOff === true) {
      setCameraOff(false);
    }
  }

  function LeaveRoom() {
    history.push("/");
    window.location.reload();
  }

  return (
    <>
      <div ref={call}>
        <div ref={mystream} id="streams">
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
