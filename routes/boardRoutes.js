const express = require('express');
const { getBoards, createBoard, getBoardById, updateBoard } = require('../controllers/boardController');

const router = express.Router();

router.get('/boards', getBoards);
router.post('/boards', createBoard);
router.get('/boards/:id', getBoardById);
router.put('/boards/:id', updateBoard);

module.exports = router;
