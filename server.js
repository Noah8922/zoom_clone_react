import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.get("/", (req, res) => {
  res.send("Running");
});

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

// const PORT = process.env.PORT || 5000;

let roomObjArr = [];

const MAXIMUM = 5;

wsServer.on("connection", (socket) => {
  let myRoomName = null;
  let myNickname = null;

  socket.on("joinRoom", async (roomName, nickname) => {
    console.log("server 연결 완료");
    console.log("joinRomm 받음 server 2");
    myRoomName = roomName;
    myNickname = nickname;
    let isRoomExist = false;
    let targetRoomObj = null;

    for (let i = 0; i < roomObjArr.length; i++) {
      // 같은 이름의 방 만들 수 없음
      if (roomObjArr[i].roomName === roomName) {
        // 정원 초과
        if (roomObjArr[i].currentNum >= MAXIMUM) {
          socket.emit("rejectJoin");
          console.log("rejectJoin 보냄 server");
          return;
        }
        // 방이 존재하면 그 방으로 들어감
        isRoomExist = true;
        targetRoomObj = roomObjArr[i];
        console.log("새로운 인원 추가되었음");
        break;
      }
    }

    // 방이 존재하지 않는다면 방을 생성
    if (!isRoomExist) {
      targetRoomObj = {
        roomName,
        currentNum: 0,
        users: [],
      };
      console.log("방을 처음으로 만든 브라우저임");
      roomObjArr.push(targetRoomObj);
    }

    // 어떠한 경우든 방에 참여
    targetRoomObj.users.push({
      socketId: socket.id,
      nickname,
    });

    targetRoomObj.currentNum++;
    socket.join(roomName);
    socket.emit("acceptJoin", targetRoomObj.users);
    console.log("acceptJoin 보냄 server 3");
  });

  socket.on("request", (roomName, userObjArr) => {
    console.log("request 받지만 server 9");
    socket.to(roomName).emit("welcome", userObjArr);
    console.log("새로운 인원이 추가 될 때 Welcome이 실행 됨 ");
  });

  socket.on("ice", (ice, remoteSocketId) => {
    socket.to(remoteSocketId).emit("ice", ice, socket.id);
  });

  socket.on("offer", async (offer, roomName, userObjArr) => {
    console.log("offer를 받음");
    socket.broadcast.to(roomName).emit("offer", offer, roomName, userObjArr);
    console.log("offer를 보냄");
  });

  socket.on("answer", (answer, roomName) => {
    console.log("answer 받음 server");
    socket.to(roomName).emit("answer", answer, roomName);
    console.log("answer 보냄 server");
  });

  socket.on("disconnecting", () => {
    socket.to(myRoomName).emit("leave_room", socket.id);

    let isRoomEmpty = false;
    // 나가면서 방의 정보를 업데이트 해주고 나가기
    for (let i = 0; i < roomObjArr.length; i++) {
      if (roomObjArr[i].roomName === myRoomName) {
        const newUsers = roomObjArr[i].users.filter(
          (user) => user.socketId !== socket.id
        );
        roomObjArr[i].users = newUsers;
        roomObjArr[i].currentNum--;
        if (roomObjArr[i].currentNum === 0) {
          isRoomEmpty = true;
        }
      }
    }
    if (isRoomEmpty) {
      const newRoomObjArr = roomObjArr.filter(
        (roomObj) => roomObj.currentNum !== 0
      );
      roomObjArr = newRoomObjArr;
    }
  });
});

const handleListen = () => console.log("Listening on http://localhost:5000");
httpServer.listen(5000, handleListen);
