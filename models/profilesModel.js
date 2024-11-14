// models/User.js
const mongoose = require('mongoose');

const profilesSchema = new mongoose.Schema(
    {
        nombrePerfil: { type: String, required: true },
        tipoUsuario: { type: String, required: true },
        sucursal: { type: String },
        sucursales: { type: Array, required: false },
        selectProducts: { type: Array }
    }, 
    { 
        timestamps: true
    }
);

const Profiles = mongoose.model('profiles', profilesSchema);

module.exports = Profiles;
