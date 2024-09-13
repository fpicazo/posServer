// models/User.js
const mongoose = require('mongoose');

const TransactionEliminadasSchema = new mongoose.Schema({
    location: { type: String, required: true },
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
    peluchemoney: { type: Number, required: false },
    pelucheqty: { type: Number, required: false },
    peluchetotal: { type: Number, required: false },
    promocionmoney: { type: Number, required: false },
    promocionqty: { type: Number, required: false },
    promociontotal: { type: Number, required: false },
    escapemoney: { type: Number, required: false },
    escapeqty: { type: Number, required: false },
    escapetotal: { type: Number, required: false },


    cortesiaMotivo: { type: String, required: false },
    cortesiaRango: { type: String, required: false },
    nameUserCortesia: { type: String, required: false },
    paymentMode: { type: String, required: true },
    client: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Client', 
      required: false
    },
    session: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Session', 
      required: false
    },
    razonEliminacion: { type: String },
    tc:{ type: String, required: false},
    
  }, { timestamps: true });

const TransactionEliminadas = mongoose.model('TransactionEliminadas', TransactionEliminadasSchema);

module.exports = TransactionEliminadas;
