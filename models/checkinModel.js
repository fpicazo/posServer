// models/User.js
const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  name : { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
   birthDate:   { type: String, required: true },
    signatureImg : { type: String, required: true },
   gameName: { type: String, required: true },
   gametime: { type: String, required: true },
   location: { type: String, required: true },
    date: { type: Date, required: false },
}, { timestamps: true

});

const Chekin = mongoose.model('chekin', checkinSchema);

module.exports = Chekin;
