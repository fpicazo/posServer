const express = require('express');
const router = express.Router();
const Profiles = require('../models/profilesModel');

const Users = require('../models/Users');

// Get all profiles
router.get('/', async (req, res) => {
    try {
        const profiles = await Profiles.find({});
        res.status(200).json(profiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log( id );
        const profile = await Profiles.findById(id);
        res.status(200).json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.get('/profilesuser/:id', async (req, res) => {
    try {
        
        const { id } = req.params;
        const users = await Users.findById(id);
        let profiles = [];
        if( users.role === 'admin' ){
            
            profiles = await Profiles.find({});
            res.status(200).json(profiles);

        }
        else if( users.role === 'gerente' ){
            
            const profiles = await Profiles.find({ _id: users.perfil });
            let arraySucursales = [];
            profiles[0].sucursales.map( ( row ) => {
                arraySucursales = [ ...arraySucursales, row._id ];
            } );
            const profilesAll = await Profiles.find({});
            let arrayProfile = profilesAll.filter( fil => arraySucursales.includes( fil.sucursal ) );
            res.status(200).json( arrayProfile.filter( x => x.tipoUsuario === 'user' ) );

        }else if( users.role === 'user' ){

            const profiles = await Profiles.find({ _id: users.perfil });
            res.status(200).json( profiles[0].selectProducts );

        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.post('/', async (req, res) => {
    try {
        const {  nombrePerfil, tipoUsuario, sucursal, sucursales, selectProducts } = req.body;

        const profiles = Profiles({ nombrePerfil, tipoUsuario, sucursal, sucursales, selectProducts });
        await profiles.save();

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put('/', async (req, res) => {
    try {
        const { _id, nombrePerfil, tipoUsuario, sucursal, sucursales, selectProducts } = req.body;

        await Profiles.findByIdAndUpdate(_id, { nombrePerfil, tipoUsuario, sucursal, sucursales, selectProducts });

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;