const mongoose = require('mongoose');

const ReservationXClienteSchema = new mongoose.Schema({
players: {  type: Number, required: true  },
date: { type: Date, required: true },
game : { type: String, required: false },
location: { type: String, required: false },
startDate: { type: Date, required: false },
endDate: { type: Date, required: false },
client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: false },
status: { type: String, required: true, default:"booked" }, // booked or cancelled or pending
reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: false }


}, { timestamps: true

});

const ReservationXCliente = mongoose.model('ReservationXCliente', ReservationXClienteSchema);

module.exports = ReservationXCliente;
