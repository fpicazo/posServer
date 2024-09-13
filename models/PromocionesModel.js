// models/User.js
const mongoose = require('mongoose');

const PromocionesSchema = new mongoose.Schema({
   location: { type: String, required: true },
    monto: { type: Number, required: true },
    conceptos: { type: Array, required: false },
    nombre: { type: String, required: false },
    estado: { type: String, required: true }

}, { timestamps: true

});

const Promociones = mongoose.model('promociones', PromocionesSchema);

module.exports = Promociones;
