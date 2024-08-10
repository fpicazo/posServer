const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const TransactionEliminadas = require('../models/TransactionEliminadas');
const moment = require('moment-timezone');

const Timezone = "America/Hermosillo";

router.get('/', async (req, res) => {
  var { startDate, endDate } = req.query;
  
  if (!startDate) {
    startDate = new Date();
  }
  if (!endDate) {
    endDate = new Date();
  }

  startDate = moment.tz(startDate, Timezone).startOf('day').toDate();
  endDate = moment.tz(endDate, Timezone).endOf('day').toDate();

  console.log("startDate:", startDate);
  console.log("endDate:", endDate);

  try {
    const transactions = await Transaction.find({ date: { $gte: startDate, $lte: endDate } });
    console.log("transactions:", transactions);

    const transactionsEliminadas = await TransactionEliminadas.find({ date: { $gte: startDate, $lte: endDate } });

    // Summing totals by concept
    const totals = {};
    transactions.forEach(transaction => {
      const data = transaction._doc; // Access the actual data within the transaction document
      Object.keys(data).forEach(key => {
        if (key.endsWith('total') && data[key] > 0) {
          if (!totals[key]) {
            totals[key] = 0;
          }
          totals[key] += data[key];
        }
      });
    });

    console.log("Summed Totals:", totals);

    // Mapping for concept keys
    const keyNameMap = {
      juegostotal: "Total Juegos",
      tarjetatotal: "Total Tarjetas",
      andadortotal: "Total Andador",
      cabinatotal: "Total Cabinas",
      campobatallatotal: "Total Campo de batalla"
    };

    // Create a new object with user-friendly key names
    const friendlyTotals = Object.keys(totals).reduce((acc, key) => {
      const friendlyName = keyNameMap[key] || key; // Use the mapped name or the original key if no mapping is found
      acc[friendlyName] = totals[key];
      return acc;
    }, {});

    // Calculate total income by payment method
    var total_final = 0;
    let incomeByPaymentMethod = {};
    transactions.forEach(transaction => {
      if (!incomeByPaymentMethod[transaction.paymentMode]) {
        incomeByPaymentMethod[transaction.paymentMode] = 0;
      }
      incomeByPaymentMethod[transaction.paymentMode] += transaction.amount;
      total_final += transaction.amount;
    });
    incomeByPaymentMethod["Total"]= total_final;

    console.log("Total Income:", JSON.stringify(incomeByPaymentMethod));

    // Mapping for payment methods
    const paymentMethodNameMap = {
      cash: "Effectivo",
      creditCard: "Tarjeta",
      cortesy: "Cortesia"
    };

    // Create a new object with friendly payment method names
    const friendlyPaymentMethods = Object.keys(incomeByPaymentMethod).reduce((acc, key) => {
      const friendlyName = paymentMethodNameMap[key] || key;
      acc[friendlyName] = incomeByPaymentMethod[key];
      return acc;
    }, {});

    const payLoad = {
      transactionsEliminadas,
      incomeByConcept: friendlyTotals,
      incomeByPaymentMethod: friendlyPaymentMethods
    };

    res.json(payLoad);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

module.exports = router;



