const express = require('express');
const router = express.Router();
const Folio = require('../models/folioModel');

router.get('/', async (req, res) => {
    const location = req.query.location;
    var folio = 0;
    const lastFolio = await Folio.findOne({ location }).sort({ createdAt: -1 });
    if (lastFolio) {
        folio = lastFolio.folio;
        
    }
    folio = folio + 1;
    res.json(folio);
}
);

router.post('/', async (req, res) => {
    const { location, folio } = req.body;
    try {
        const newFolio = new Folio({
            location,
            folio
        });
        await newFolio.save();
        res.status(201).json(newFolio);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding folio" });
    }
}
);

  

module.exports = router;



