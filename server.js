const app = require("express")();
const cors = require("cors");

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Running");
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
