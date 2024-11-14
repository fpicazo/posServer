// models/User.js
const mongoose = require('mongoose');

const folioSchema = new mongoose.Schema({
   location: { type: String, required: true },
    folio: { type: Number, required: true },
}, { timestamps: true

});

const Folio = mongoose.model('folio', folioSchema);

module.exports = Folio;