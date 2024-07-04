const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
dateOpen: { type: Date, required: true },
dateClose: { type: Date, required: false },
status : { type: String, required: false }, // opening or closed
openingAmount: { type: Number, required: false },
closingAmount: { type: Number, required: false },
cashAmount :{ type: Number, required: false },
cardAmount: { type: Number, required: false },
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, { timestamps: true

});

const Transaction = mongoose.model('SessionSchema', SessionSchema);

module.exports = Transaction;
