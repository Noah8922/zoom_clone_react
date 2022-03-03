const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

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

//How Do we know that some socket are connected to server?
io.on("connection", (socket) => {
  console.log(socket);
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  socket.on("calluser", ({ userToCall, signalData, from, name }) => {
    console.log(userToCall, signalData, from, name);
    io.to(userToCall).emit("calluser", { from, name, signal: signalData });
  });

  socket.on("answerCall", (data) => {
    console.log(data);
    io.to(data.to).emit("callaccepted", data.signal);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
