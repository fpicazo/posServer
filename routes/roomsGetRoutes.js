const express = require('express');
const router = express.Router();
const Rooms = require('../models/roomsModel');


router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rooms = await Rooms.find({ idBranches: id });
        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
