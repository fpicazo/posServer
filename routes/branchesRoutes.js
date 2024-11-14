const express = require('express');
const router = express.Router();
const Branches = require('../models/branchesModel');

const Users = require('../models/Users');
const Profiles = require('../models/profilesModel');

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


router.get('/:id', async (req, res) => {
    try {

        const { id } = req.params;

        const users = await Users.findById(id);
        if( users.role === 'admin' ){
            
            const branches = await Branches.find({});
            res.status(200).json(branches);

        }else if( users.role === 'gerente' ){
            
            const profiles = await Profiles.find({ _id: users.perfil });
            res.status(200).json(profiles[0].sucursales);

        }else if( users.role === 'user' ){
            
            const profiles = await Profiles.find({ _id: users.perfil });
            const brancheUser = await Branches.find({ _id: profiles[0].sucursal });
            res.status(200).json(brancheUser[0]);

        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});  


router.post('/', async (req, res) => {
    try {
        const { nombreSucursal, estado, direccion } = req.body;

        const branches = Branches({ nameBranches: nombreSucursal, state: estado, address: direccion });
        await branches.save();

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put('/', async (req, res) => {
    try {
        const { _id, nombreSucursal, estado, direccion } = req.body;

        await Branches.findByIdAndUpdate(_id, { nameBranches: nombreSucursal, state: estado, address: direccion });

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
