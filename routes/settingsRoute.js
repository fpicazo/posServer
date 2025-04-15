const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const TransactionEliminadas = require('../models/TransactionEliminadas');
const Types = require('../models/typesModel');
const moment = require('moment-timezone');

const Timezone = "America/Hermosillo";

const fs = require('fs');

router.get('/', async (req, res) => {
  
  var { startDate, endDate, branches } = req.query;
  // console.log("branches:", branches);
  
  if (!startDate) {
    startDate = new Date();
  }
  if (!endDate) {
    endDate = new Date();
  }

  startDate = moment.tz(startDate, Timezone).startOf('day').toDate();
  endDate = moment.tz(endDate, Timezone).endOf('day').toDate();

  // console.log("startDate:", startDate); 
  // console.log("endDate:", endDate);
 
  try {

    const branchFilter = branches && branches.length > 0 ? [ { sucursal: { $in: branches } }, { sucursal: { $exists: false } } ] : {};
    // console.log("branchFilter:", branchFilter);
    // console.log( " branches ", JSON.stringify(branches) );
    // Find transactions within the date range and filter by selected branches
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate },
      $or: branchFilter  // Documentos sin el campo 'sucursal'
      
    });



    const types = await Types.find({});
    let encabezadosTipos = [];
    types.sort((a, b) => a.order - b.order).map( ( r ) => {
        encabezadosTipos = [ ...encabezadosTipos, {
        tipo: r.type,
        cantidad: `${r.type} Cantidad`,
        precio: `${r.type} Precio`,
        total: `${r.type} total`
        } ];
    } );


    // fs.writeFile('datos.json', JSON.stringify(transactions, null, 2), (err) => {
    //   if (err) {
    //     console.error('Error al guardar el archivo:', err);
    //   } else {
    //     console.log('Archivo guardado exitosamente.');
    //   }
    // });

    let fetchedTransaccionesNew = [];
    transactions.map( ( row ) => {
        let fila = {};

        fila._id = row._id;
        fila.location = row.location;
        fila.date = row.date;
        fila.amount = row.amount;

        if( row.concepts.length > 0 ){
          
          encabezadosTipos.map( ( a ) => {
              
              let cuenta = row.concepts.find( x => x.type === a.tipo );
              if( cuenta ){
              fila[a.cantidad] = cuenta.qty;
              fila[a.precio] = cuenta.money;
              fila[a.total] = cuenta.total;
              }else{
              fila[a.cantidad] = 0;
              fila[a.precio] = 0;
              fila[a.total] = 0;
              }
          } )

        }else{

          fila['Campo de Batalla Cantidad'] = row.campobatallaqty;
          fila['Campo de Batalla Precio'] = row.campobatallamoney;
          fila['Campo de Batalla total'] = row.campobatallatotal;

          fila['Maquinas Cantidad'] = row.juegosqty;
          fila['Maquinas Precio'] = row.juegosmoney;
          fila['Maquinas total'] = row.juegostotal;

          fila['Cabinas Inmersivas Cantidad'] = row.cabinaqty;
          fila['Cabinas Inmersivas Precio'] = row.cabinamoney;
          fila['Cabinas Inmersivas total'] = row.cabinatotal;

          fila['Tarjeta Cantidad'] = row.tarjetaqty;
          fila['Tarjeta Precio'] = row.tarjetamoney;
          fila['Tarjeta total'] = row.tarjetatotal;

          fila['Andador Virtual Cantidad'] = row.andadorqty;
          fila['Andador Virtual Precio'] = row.andadormoney;
          fila['Andador Virtual total'] = row.andadortotal;

          fila['Eventos Cantidad'] = row.eventosqty;
          fila['Eventos Precio'] = row.eventosmoney;
          fila['Eventos total'] = row.eventostotal;

          fila['Peluche Cantidad'] = row.pelucheqty;
          fila['Peluche Precio'] = row.peluchemoney;
          fila['Peluche total'] = row.peluchetotal;

          fila['Promociones Cantidad'] = row.promocionqty;
          fila['Promociones Precio'] = row.promocionmoney;
          fila['Promociones total'] = row.promociontotal;

          fila['Escape Cantidad'] = row.escapeqty;
          fila['Escape Precio'] = row.escapemoney;
          fila['Escape total'] = row.escapetotal;

          fila['Alimentos Cantidad'] = 0;
          fila['Alimentos Precio'] = 0;
          fila['Alimentos total'] = 0;

          fila['Bebidas Cantidad'] = 0;
          fila['Bebidas Precio'] = 0;
          fila['Bebidas total'] = 0;



        }

        fila.idinterno = row.idinterno;
        fila.session = row.session;
        fila.tc = row.tc;
        fila.sucursal = row.sucursal;
        fila.paymentMode = row.paymentMode;
        fila.client = row.client;
        fetchedTransaccionesNew = [ ...fetchedTransaccionesNew, fila ];

    } );



    //console.log("transactions:", transactions);

    const transactionsEliminadas = await TransactionEliminadas.find({ date: { $gte: startDate, $lte: endDate },
      ...branchFilter  });

    // Summing totals by concept
    const totals = {};
    // transactions.forEach(transaction => {
    //   const data = transaction._doc; // Access the actual data within the transaction document
    //   Object.keys(data).forEach(key => {
    //     if (key.endsWith('total') && data[key] > 0) {
    //       if (!totals[key]) {
    //         totals[key] = 0;
    //       }
    //       totals[key] += data[key];
    //     }
    //   });
    // });

    fetchedTransaccionesNew.forEach(transaction => {
      Object.keys(transaction).forEach(key => {
        if (key.endsWith('total') && transaction[key] > 0) {
          if (!totals[key]) {
            totals[key] = 0;
          }
          totals[key] += transaction[key];
        }
      });
    });

    // fs.writeFile('datos2.json', JSON.stringify(fetchedTransaccionesNew, null, 2), (err) => {
    //   if (err) {
    //     console.error('Error al guardar el archivo:', err);
    //   } else {
    //     console.log('Archivo guardado exitosamente.');
    //   }
    // });
    console.log("Summed Totals:", totals);

    // Mapping for concept keys
    const keyNameMap = {
      juegostotal: "Total Juegos",
      tarjetatotal: "Total Tarjetas",
      andadortotal: "Total Andador",
      cabinatotal: "Total Cabinas",
      campobatallatotal: "Total Campo de batalla",
      bebidastotal: "Total Bebidas"
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

    // console.log("Total Income:", JSON.stringify(incomeByPaymentMethod));

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



