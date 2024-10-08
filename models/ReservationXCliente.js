const mongoose = require('mongoose');

const ReservationXClienteSchema = new mongoose.Schema({
players: {  type: Number, required: true  },
date: { type: Date, required: true },
game : { type: String, required: false },
location: { type: String, required: false,default:"Tepic" },
startDate: { type: Date, required: false },
endDate: { type: Date, required: false },
client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: false },
status: { type: String, required: true, default:"booked" }, // booked or cancelled or pending
reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: false },
transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: false },
cupon: { type: String, required: false },
discount: { type: Number, required: false },
idinterno: { type: String, required: false },


}, { timestamps: true

});

const ReservationXCliente = mongoose.model('ReservationXCliente', ReservationXClienteSchema);

module.exports = ReservationXCliente;
