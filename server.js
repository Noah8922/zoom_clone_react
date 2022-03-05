const app = require("express")();
const cors = require("cors");

const httpServer = require("http").createServer(app);
const wsServer = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Running");
});

app.use(cors());

const PORT = process.env.PORT || 5000;

let roomObjArr = [];

const MAXIMUM = 5;

wsServer.on("connection", (socket) => {
  let myRoomName = null;
  let myNickname = null;

  socket.on("joinRoom", (roomName, nickname) => {
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
          return;
        }
        // 방이 존재하면 그 방으로 들어감
        isRoomExist = true;
        targetRoomObj = roomObjArr[i];
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
  });

  socket.on("ice", (ice, remoteSocketId) => {
    console.log(ice, remoteSocketId);
    socket.to(remoteSocketId).emit("ice", ice, socket.id);
  });

  socket.on("offer", (offer, remoteSocketId, localNickname) => {
    socket.to(remoteSocketId).emit("offer", offer, socket.id, localNickname);
  });

  socket.on("answer", (answer, remoteSocketId) => {
    socket.to(remoteSocketId).emit("answer", answer, socket.id);
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

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(5000, handleListen);
