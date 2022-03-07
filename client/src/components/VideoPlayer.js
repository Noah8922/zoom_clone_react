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
  const userVideo1 = useRef();
  const userVideo2 = useRef();
  const userVideo3 = useRef();
  const userVideo4 = useRef();

  let myPeerConnection;
  let nickname = "noah";
  let pcObj = {};
  let peopleInRoom = 1;
  let peerstreamArr;
  let myStream;

  const socket = io("http://localhost:5000"); //Server adress

  useEffect(() => {
    socket.emit("joinRoom", roomName, nickname);
    console.log("joinRoom 보냄 client 1");
  }, []);

  socket.on("acceptJoin", async (userObjArr) => {
    console.log("acceoptJoin 받음 client4");
    console.log("카메라랑 마이크 먼저 가져오기");
    await getMedia();
    makeConnection();
    socket.emit("request", roomName, userObjArr);
    console.log("reqeust를 보내면 8");

    // console.log("how many people in here", userObjArr);

    // 나 혼자일 경우는 여기까지 실행
    // if (length === 1) {
    //   console.log("혼자 있을 경우 현재인원 ", userObjArr);
    //   return;
    // }

    // const length = userObjArr.length;

    //offer은 기존에 방을 만든 사람이 만드는 거 아닌가.
    // 기존에 방에 있던 사람들에게 offer를 제공한다.
    // for (let i = 0; i < length; i++) {
    //   console.log("현재인원수", userObjArr);
    //   try {
    //     const newPC = makeConnection(
    //       userObjArr,
    //       userObjArr[i].socketId,
    //       userObjArr[i].nickname
    //     );
    //     const offer = await newPC.createOffer(); // 각 연결들에 대해 offer를 생성
    //     await newPC.setLocalDescription(offer);
    //     socket.emit("offer", offer, userObjArr[i].socketId, nickname); // offer를 받을 socket id와 보내는 사람의 닉네임
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }
  });

  //새로운 인원이 브라우저에 들어오면 일어나는 일
  socket.on("welcome", async (userObjArr) => {
    console.log("Welcome이 실행되었음, 누군가 들어왔다 offer를 만들자");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName, userObjArr);
    console.log("offer를 서버로 보냄 clinet", offer);

    // const length = userObjArr.length;

    // for (let i = 0; i < length; i++) {
    //   console.log("현재인원수", userObjArr);
    //   try {
    //     const newPC = makeConnection(
    //       userObjArr,
    //       userObjArr[i].socketId,
    //       userObjArr[i].nickname
    //     );
    //     const offer = await newPC.createOffer(); // 각 연결들에 대해 offer를 생성
    //     await newPC.setLocalDescription(offer);
    //     socket.emit("offer", offer, userObjArr[i].socketId, nickname); // offer를 받을 socket id와 보내는 사람의 닉네임
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }
  });

  socket.on("offer", async (offer, roomName, userObjArr) => {
    console.log(offer, "서버로부터 Offer를 받음 client ");
    await myPeerConnection.setRemoteDescription(offer);
    console.log("받은 offer를 현브라우저에 원격으로 저장하고");
    const answer = await myPeerConnection.createAnswer();
    console.log("asnwer을 생성하고");
    console.log(answer);
    await myPeerConnection.setLocalDescription(answer);
    console.log("만든 Answer를 현브라우저에 저장하고");
    socket.emit("answer", answer, roomName);
    console.log("asnwer을 보낸다");
    // try {
    //   const myPeerConnection = makeConnection(remoteSocketId, remoteNickname);
    //   await myPeerConnection.setRemoteDescription(offer);
    //   const answer = await myPeerConnection.createAnswer();
    //   // console.log("this is answer", answer);
    //   await myPeerConnection.setLocalDescription(answer);
    //   socket.emit("answer", answer, remoteSocketId);
    // } catch (error) {
    //   console.log(error);
    // }
  });

  //방 만든 브라우저에서 일어나는 일 (참가한 방에서 보낸 answer을 받아 저장함.)
  socket.on("answer", async (answer, roomName) => {
    console.log("anwer을 받음 client", answer);
    myPeerConnection.setRemoteDescription(answer);
    console.log("받은 answer을 현브라우저에 저장");

    // await pcObj[remoteSocketId].setRemoteDescription(answer);
  });

  async function getMedia(deviceId) {
    console.log("getMedia 함수 실행 5");
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
      console.log("여기서 myStream을 가져오고");
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

  function makeConnection(roomName, nickname) {
    myPeerConnection = new RTCPeerConnection(); //각각에 peerConnection을 만든다.
    console.log("현브라우저에 peerconnection 생성하고 7", myPeerConnection);
    // console.log("새로들어온 인원업데이트", remoteSocketId)
    // myPeerConnection = new RTCPeerConnection({
    //   iceServers: [
    //     {
    //       urls: [
    //         "stun:stun.l.google.com:19302",
    //         "stun:stun1.l.google.com:19302",
    //         "stun:stun2.l.google.com:19302",
    //         "stun:stun3.l.google.com:19302",
    //         "stun:stun4.l.google.com:19302",
    //       ],
    //     },
    //   ],
    // });
    // myPeerConnection.addEventListener("icecandidate", (event) => {
    //   handleIce(event, roomName);
    // });
    // myPeerConnection.addEventListener("track", (data) => {
    // console.log("this is for addstream ", data);
    // if (data.track.kind === "audio") {
    //   peeraudio = data.track;
    // } else if (data.track.kind === "video") {
    //   peervideo = data.track;
    // }
    // console.log(peeraudio, peervideo);

    // paintPeerFace(data.streams[0], remoteSocketId, remoteNickname);
    // });
    // // 내 영상을 myPeerConnection에 올림. 위 listner들보다 위에 위치해도 될까?
    // console.log(myStream.getTracks());
    myStream
      .getTracks()
      .forEach((track) => myPeerConnection.addTrack(track, myStream));
    //addtrack(track, mystream) => track은 connection에 추가될 객체이고 myStream은 그안에 들어갈 내용물이다.

    // Audio.forEach((track) => myPeerConnection.addTrack(track));
    // Video.forEach((track) => myPeerConnection.addTrack(track));

    // Audio.forEach((track) => myPeerConnection.addTrack(track, myStream));
    // Video.forEach((track) => myPeerConnection.addTrack(track, myStream));

    // pcObj에 각 사용자와의 connection 정보를 저장함
    // pcObj[remoteSocketId] = myPeerConnection;

    // peopleInRoom++;

    return myPeerConnection;
  }

  function handleIce(data, roomName) {
    if (data.candidate) {
      socket.emit("ice", data.candidate, roomName);
    }
  }

  socket.on("ice", async (ice, remoteSocketId) => {
    // await pcObj[remoteSocketId].addIceCandidate(ice);
  });

  async function paintPeerFace(data, id, remoteNickname, userObjArr) {
    try {
      // console.log(data);
      // for (let i=0; i<userObjArr.length; i++){
      //   addVideoStream(userVideo[i].current, data);
      //   videoGrid.current.append(userVideo[i].current);
      // }
    } catch (error) {
      console.log(error);
    }
  }

  // async function getMedia(deviceId) {
  //   try {
  //     myStream = await navigator.mediaDevices
  //       .getUserMedia({ video: true, audio: false })
  //       .then((stream) => {
  //         console.log("111111");
  //         myStream = stream;
  //         let streamId = stream.id;
  //         audio = myStream
  //           .getTracks()
  //           .filter((track) => track.kind === "audio");
  //         video = myStream
  //           .getTracks()
  //           .filter((track) => track.kind === "video");

  //         setAduio(audio);
  //         setVideo(video);
  //
  //         return stream
  //       });
  //     if (!deviceId) {
  //       await getCameras();
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

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

  // function AddStream(peeraudio, peervideo, remoteSocketId, remoteNickname) {
  //   // console.log("this is the event : ", peervideo);
  //   paintPeerFace(peeraudio, peervideo, remoteSocketId, remoteNickname);
  // }

  ////////////////////////////////////////////////////////////////////

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

  function LeaveRoom() {
    history.push("/");
    window.location.reload();
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

// 영상 스트림을 DOM 비디오 엘리먼트에 넣어주는 함수
async function addVideoStream(video, stream) {
  console.log("addvideoStream 실행해서 비디오를 띄우고 6");
  try {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
  } catch (error) {
    console.log(error);
  }
}

export default Videoplayer;
