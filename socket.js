const { Server } = require("socket.io");
const { MongoClient, ObjectId } = require("mongodb");

const uri =
  "mongodb+srv://drawingBoardUser:hw4hvI6nWe8EaKV3@cluster0.xmw7zrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let db, boardCollection;

const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "https://collaborative-drawing-bo-25f95.web.app",
      methods: ["GET", "POST"],
    },
  });

  client.connect().then(() => {
    db = client.db("drawingBoard");
    boardCollection = db.collection("boards");
  });

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("join", async (boardId) => {
      socket.join(boardId);
      const board = await boardCollection.findOne({
        _id: new ObjectId(boardId),
      });
      socket.emit("loadBoard", board.elements || []);
      console.log(`Client ${socket.id} joined board ${boardId}`);
    });

    socket.on("drawing", async (data) => {
      const { boardId, element } = data;
      await boardCollection.updateOne(
        { _id: new ObjectId(boardId) },
        { $push: { elements: element } }
      );
      io.to(boardId).emit("drawing", element);
      console.log(`Drawing event on board ${boardId}:`, element);
    });

    socket.on("erase", async (data) => {
      const { boardId, element } = data;
      await boardCollection.updateOne(
        { _id: new ObjectId(boardId) },
        { $pull: { elements: element } }
      );
      io.to(boardId).emit("erase", element);
      console.log(`Erase event on board ${boardId}:`, data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

module.exports = { setupWebSocket };
