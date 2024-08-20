// models/User.js
const mongoose = require('mongoose');

const TransaccionSchema = new mongoose.Schema({
    location: { type: String ,default:"Tepic"},
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    concept: { type: Array, required: true },
    campobatallamoney: { type: Number, required: false },
    campobatallaqty: { type: Number, required: false },
    campobatallatotal: { type: Number, required: false },
    juegosmoney: { type: Number, required: false },
    juegosqty: { type: Number, required: false },
    juegostotal: { type: Number, required: false },
    cabinamoney: { type: Number, required: false },
    cabinaqty: { type: Number, required: false },
    cabinatotal: { type: Number, required: false },
    tarjetaqty: { type: Number, required: false },
    tarjetamoney: { type: Number, required: false },
    tarjetatotal: { type: Number, required: false },

    andadormoney: { type: Number, required: false },
    andadorqty: { type: Number, required: false },
    andadortotal: { type: Number, required: false },
    eventosmoney: { type: Number, required: false },
    eventosqty: { type: Number, required: false },
    eventostotal: { type: Number, required: false },

    cortesiaMotivo: { type: String, required: false },
    cortesiaRango: { type: String, required: false },
    nameUserCortesia: { type: String, required: false },
    paymentMode: { type: String, required: true },
    idinterno: { type: String, required: false },
    razonEliminacion: { type: String },
    client: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Client', 
      required: false
    },
    session: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Session', 
      required: false
    }
  }, { timestamps: true });

const Transactions = mongoose.model('Transactions', TransaccionSchema);

module.exports = Transactions;
