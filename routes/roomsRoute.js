const express = require('express');
const router = express.Router();
const Rooms = require('../models/roomsModel');


// Get all branches
router.get('/', async (req, res) => {
    try {
        const rooms = await Rooms.find({});
        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});  


router.post('/', async (req, res) => {
    try {
        
        const { idSucursal, nombreSala, tipo, horaInicio, horaFin, costos, certificadoNom, certificadoNomCostoMembresia, certificadoNomCostoNormal } = req.body;

        const rooms = Rooms({ 
            idBranches: idSucursal,
            nameRooms: nombreSala.toUpperCase(),
            type: tipo,
            startTime: horaInicio,
            endTime: horaFin,
            costs: costos,
            certificateNom: certificadoNom,
            certificateNameCostMembership: certificadoNomCostoMembresia,
            certificateNomCostNormal: certificadoNomCostoNormal
        });
        await rooms.save();

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put('/', async (req, res) => {
    try {
        const { _id, idSucursal, nombreSala, tipo, horaInicio, horaFin, costos, certificadoNom, certificadoNomCostoMembresia, certificadoNomCostoNormal } = req.body;

        await Rooms.findByIdAndUpdate(_id, { 
            idBranches: idSucursal,
            nameRooms: nombreSala,
            type: tipo,
            startTime: horaInicio,
            endTime: horaFin,
            costs: costos,
            certificateNom: certificadoNom,
            certificateNameCostMembership: certificadoNomCostoMembresia,
            certificateNomCostNormal: certificadoNomCostoNormal
         });

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
