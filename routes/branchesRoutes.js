const express = require('express');
const router = express.Router();
const Branches = require('../models/branchesModel');
const TaxCompany = require('../models/taxCompanyModel');

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


router.get('/one/:id', async (req, res) => {
    try {

        const { id } = req.params;

        const brancheUser = await Branches.find({ _id: id });
        const taxCompany = await TaxCompany.findById(brancheUser[0].company);
        console.log( { branche: brancheUser[0], taxCompany } );
        res.status(200).json({ branche: brancheUser[0], taxCompany });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.post('/', async (req, res) => {
    try {
        const { nombreSucursal, empresa, estado, moneda, direccion, telefono, abierto } = req.body;

        const branches = Branches({ nameBranches: nombreSucursal, company: empresa, state: estado, currency: moneda, address: direccion, phone: telefono, open: abierto });
        await branches.save();

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put('/', async (req, res) => {
    try {
        const { _id, nombreSucursal, empresa, estado, moneda, direccion, telefono, abierto } = req.body;

        await Branches.findByIdAndUpdate(_id, { nameBranches: nombreSucursal, company: empresa, state: estado, currency: moneda, address: direccion, phone: telefono, open: abierto });

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put('/stripe', async (req, res) => {
    try {
        const { id, stripe } = req.body;

        await Branches.findByIdAndUpdate(id, { stripe: stripe });

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
