const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://drawingBoardUser:hw4hvI6nWe8EaKV3@cluster0.xmw7zrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let db, boardCollection;

async function connectToDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db('drawingBoard');
      boardCollection = db.collection('boards');
      console.log('Database connected and collection initialized.');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }
}

const getBoards = async (req, res) => {
  try {
    await connectToDB();
    const boards = await boardCollection.find().toArray();
    res.json(boards);
  } catch (error) {
    console.error('Error retrieving boards:', error);
    res.status(500).json({ message: 'Failed to fetch boards' });
  }
};

const createBoard = async (req, res) => {
  try {
    await connectToDB();
    const result = await boardCollection.insertOne(req.body);
    console.log('Creating board:', req.body);
    if (result.acknowledged) {
      const insertedBoard = await boardCollection.findOne({ _id: result.insertedId });
      res.status(201).json(insertedBoard);
    } else {
      throw new Error('Failed to insert board');
    }
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ message: 'Failed to create board', error });
  }
};

const getBoardById = async (req, res) => {
  try {
    await connectToDB();
    const board = await boardCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.json(board);
  } catch (error) {
    console.error('Error retrieving board:', error);
    res.status(500).json({ message: 'Failed to retrieve board', error });
  }
};

const updateBoard = async (req, res) => {
  try {
    await connectToDB();
    const { boardId, element } = req.body;
    const result = await boardCollection.updateOne(
      { _id: new ObjectId(boardId) },
      { $push: { elements: element } }
    );
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Board updated successfully' });
    } else {
      throw new Error('Failed to update board');
    }
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({ message: 'Failed to update board', error });
  }
};

module.exports = {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard
};
