const express = require('express');
const router = express.Router();
const Promociones = require('../models/PromocionesModel');

router.get('/', async (req, res) => {
    const location = req.query.location;
    const promociones = await Promociones.find({ location,estado:"activa" });
    res.json(promociones);
}
    
);

router.post('/', async (req, res) => {
    const { location, monto, conceptos, nombre } = req.body;
    try {
        const newPromociones = new Promociones({
            location,
            monto,
            conceptos,
            nombre,
            estado:"activa"
        });
        await newPromociones.save();
        res.status(201).json(newPromociones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding promociones" });
    }
}
);

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const promociones = await Promociones.findById(id);
    if (!promociones) {
        return res.status(404).json({ message: "Promociones not found" });
    }
    res.json(promociones);
}
);

router.put('/inactiva/:id', async (req, res) => {
    const { id } = req.params;
    const promociones = await Promociones.findById(id);
    if (!promociones) {
        return res.status(404).json({ message: "Promociones not found" });
    }
    promociones.estado = "inactiva";
    await promociones.save();
    res.json(promociones);
}   
);
   
module.exports = router;



