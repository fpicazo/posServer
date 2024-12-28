const express = require('express');
const router = express.Router();
const Branches = require('../models/branchesModel');


// Get all branches
router.get('/', async (req, res) => {
    try {
        const branches = await Branches.find({});
        res.status(200).json(branches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
