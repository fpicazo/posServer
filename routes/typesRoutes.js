const express = require('express');
const router = express.Router();
const Types = require('../models/typesModel');

// Get all types
router.get('/', async (req, res) => {
    try {
        const types = await Types.find({});
        res.status(200).json(types);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});  


module.exports = router;
