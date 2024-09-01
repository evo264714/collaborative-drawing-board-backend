const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://collaborative-drawing-bo-25f95.web.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

app.use(
  cors({
    origin: "https://collaborative-drawing-bo-25f95.web.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const uri =
  "mongodb+srv://drawingBoardUser:hw4hvI6nWe8EaKV3@cluster0.xmw7zrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let db, boardCollection;

client
  .connect()
  .then(() => {
    db = client.db("drawingBoard");
    boardCollection = db.collection("boards");
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.get("/api/boards", async (req, res) => {
  try {
    const boards = await boardCollection.find({}).toArray();
    res.status(200).json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/boards", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await boardCollection.insertOne({ name, elements: [] });
    const insertedBoard = await boardCollection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(insertedBoard);
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/boards/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const board = await boardCollection.findOne({ _id: new ObjectId(id) });
    if (board) {
      res.status(200).json(board);
    } else {
      res.status(404).json({ message: "Board not found" });
    }
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/updateBoard", async (req, res) => {
  const { boardId, element } = req.body;
  try {
    await boardCollection.updateOne(
      { _id: new ObjectId(boardId) },
      { $push: { elements: element } }
    );
    res.status(200).json({ message: "Board updated" });
  } catch (error) {
    console.error("Error updating board:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", async (boardId) => {
    try {
      socket.join(boardId);
      const board = await boardCollection.findOne({
        _id: new ObjectId(boardId),
      });
      socket.emit("loadBoard", board ? board.elements : []);
      console.log(`Client ${socket.id} joined board ${boardId}`);
    } catch (error) {
      console.error("Error joining board:", error);
      socket.emit("error", { message: "Error joining board" });
    }
  });

  socket.on("drawing", async (data) => {
    const { boardId, element } = data;
    try {
      await boardCollection.updateOne(
        { _id: new ObjectId(boardId) },
        { $push: { elements: element } }
      );
      io.to(boardId).emit("drawing", element);
      console.log(`Drawing event on board ${boardId}:`, element);
    } catch (error) {
      console.error("Error updating drawing:", error);
    }
  });

  socket.on("erase", async (data) => {
    const { boardId, element } = data;
    try {
      const result = await boardCollection.updateOne(
        { _id: new ObjectId(boardId) },
        { $pull: { elements: { id: element.id } } }
      );
      if (result.modifiedCount > 0) {
        io.to(boardId).emit("erase", element);
      } else {
        console.error("No matching element found to erase.");
      }
    } catch (error) {
      console.error("Error erasing element:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
