const express = require('express');
const router = express.Router();
const Transactions = require('../models/Transaction');
const TransactionEliminadas = require('../models/TransactionEliminadas');
const Reservation = require('../models/Reservation');
const ReservationXCliente = require('../models/ReservationXCliente');
const Client = require('../models/Client');
const moment = require('moment-timezone');
const Timezone = "America/Hermosillo";


// POST route to add a new note
router.post('/', async (req, res) => {
  console.log("New transaccion", req.body);
  try {

    
    const { amount, client, paymentMode,sessionid,cortesiaMotivo,cortesiaRango,nameUserCortesia,idinterno } = req.body;
    console.log("BODY new transaccion ", req.body);
    var concept = req.body?.concept;
    let { date } = req.body; // Declare date with let so it can be reassigned
    
    // Check if date is not provided and assign the current date to it
    if (!date) {
      date = new Date();
    }

    if (!concept ) {
      concept = [{ name: 'Campo de Batalla', price: req.body?.campobatallamoney, quantity: req.body?.campobatallaqty }];
    }

    //console.log("Concept", concept);
    const productPhrases = concept?.map(product => {
      const amount = product.price * product.quantity;
      return `${product.name} - ${product.quantity} - $${amount}`;
    }).join(' || ');
    console.log("productPhrases2", productPhrases);


     // Initialize variables to store aggregated values
     let campobatallamoney = 0, campobatallaqty = 0, campobatallatotal = 0;
     let juegosmoney = 0, juegosqty = 0, juegostotal = 0;
     let cabinamoney = 0, cabinaqty = 0, cabinatotal = 0;
     let tarjetamoney = 0, tarjetaqty = 0, tarjetatotal = 0, andadormoney = 0, andadorqty = 0, 
     andadortotal = 0, eventosmoney = 0, eventosqty = 0, eventostotal = 0;

    concept.forEach(product => {

      console.log("product + ", product);
      const { name, price, quantity } = product;
      const total = price * quantity;

      switch (name) {
        case 'Campo de Batalla':
          campobatallamoney += price;
          campobatallaqty += quantity;
          campobatallatotal += total;
          break;
        case 'Maquinas':
          juegosmoney += price;
          juegosqty += quantity;
          juegostotal += total;
          break;
        case 'Cabinas Inmersivas' :
        case 'Cabinas Inmersivas 15m':
          cabinamoney += price;
          cabinaqty += quantity;
          cabinatotal += total;
          break;
        case 'Tarjeta':
          tarjetamoney += price;
          tarjetaqty += quantity;
          tarjetatotal += total;
          break;
          case 'Andador Virtual':
          andadormoney += price;
          andadorqty += quantity;
          andadortotal += total;
          break;
          case 'Eventos':
          eventosmoney += price;
          eventosqty += quantity;
          eventostotal += total;
          break;
        default:
          console.log(`Product ${name} does not match any category.`);
      }
      console.log("cabinatotal + ", cabinatotal);
    });



    const newTransaction = new Transactions({
      date,
      amount,
      concept:productPhrases,
      paymentMode,
      session: sessionid,
        if (client) {
          client: client;
        },
        campobatallamoney,
      campobatallaqty,
      campobatallatotal,
      juegosmoney,
      juegosqty,
      juegostotal,
      cabinamoney,
      cabinaqty,
      cabinatotal,
      tarjetamoney,
      tarjetaqty,
      tarjetatotal,
      andadormoney,
      andadorqty,
      andadortotal,
      eventosmoney,
      eventosqty,
      eventostotal,
      cortesiaMotivo,
      cortesiaRango,
      nameUserCortesia,
      idinterno,



        });

        await newTransaction.save();

        if (idinterno) {
          const searchReservacionporcliente = await ReservationXCliente.findOne({ idinterno: idinterno });
          if (searchReservacionporcliente) {
            searchReservacionporcliente.transaction = newTransaction._id;
            await searchReservacionporcliente.save();
          }
        }


    
    res.status(201).json(newTransaction);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding Transaction" });
  }
});
         
router.get('/weekly-summary', async (req, res) => {
  const today = new Date();
  const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));

  try {
    const summary = await Transactions.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo, $lte: new Date() },
          modo: "pos"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" }
          },
          totalAmount: { $sum: "$amount" },
          totalByConcept: { 
            $push: {
              concept: "$concept",
              amount: "$amount"
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Error fetching weekly transaction summary:", error);
    res.status(500).json({ message: "Error fetching transaction summary" });
  }
});



router.get('/', async (req, res) => {
  const { startDate, endDate } = req.query;
  console.log("QUERY ", req.query);
  const query = {};
  console.log("startDate ", moment.tz(startDate, Timezone).toDate());
  console.log("endDate ", moment.tz(endDate, Timezone).toDate());
  if (startDate) {
    query.date = { $gte: moment.tz(startDate, Timezone).toDate() };
  }

  if (endDate) {
    if (!query.date) {
      query.date = {};
    }
    query.date.$lte = moment.tz(endDate, 'America/Mexico_City').endOf('day').toDate();

  }

  try {
    const transactions = await Transactions.find(query).sort({ createdAt: -1 }); // replace `createdAt` with your date field
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});


router.get('/eliminadas', async (req, res) => {
  const { startDate, endDate } = req.query;
  console.log("QUERY ", req.query);
  const query = {};
  console.log("startDate ", moment.tz(startDate, Timezone).toDate());
  console.log("endDate ", moment.tz(endDate, Timezone).toDate());
  if (startDate) {
    query.date = { $gte: moment.tz(startDate, Timezone).toDate() };
  }

  if (endDate) {
    if (!query.date) {
      query.date = {};
    }
    query.date.$lte = moment.tz(endDate, 'America/Mexico_City').endOf('day').toDate();

  }

  try {
    const transactions = await TransactionEliminadas.find(query).sort({ createdAt: -1 }); // replace `createdAt` with your date field
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

// PUT route to update a note
router.put('/:id', async (req, res) => {
  const { id } = req.params;
    const { date,amount,concept,client,paymentMode } = req.body;
  try {
    const updatedTransaction = await Transactions.findByIdAndUpdate(
        id, 
        { date,amount,concept,client,paymentMode },
        { new: true }
        );

    if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
        }

    res.json(updatedTransaction);
    } catch (error) {
        res.status(500).json({ message: "Error updating client" });
    }
}
);


// DELETE route to remove a note
router.delete('/:id', async (req, res) => {
  //console.log("DELETE", req.params);
  try {
    const { id } = req.params;
    const { razonEliminacion } = req.query;

    

    // Find the transaction by ID
    const searchTransaction = await Transactions.findById(id);
    //console.log("searchTransaction", searchTransaction);
  

    // Check if the transaction exists
    if (!searchTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    searchTransaction.razonEliminacion = razonEliminacion;
    // Create a new document in the TransactionEliminadas collection
    const newTransactionEliminadas = new TransactionEliminadas(searchTransaction.toObject());
    await newTransactionEliminadas.save(); // Save the deleted transaction to the collection
 
    // Delete the transaction from the Transactions collection
    const transaction = await Transactions.findByIdAndDelete(id);
   console.log("idinterno", searchTransaction?.idinterno ); 
   if (!searchTransaction?.idinterno) {
    return res.status(404).json({ message: "idinterno not found" });
  }
    // search reservacionxclientes y eliminarla. tambien buscar la reservacion y eliminarla y no tiene otra reservacionxclientes
    const searchReservacionporcliente = await ReservationXCliente.findOne({ idinterno: searchTransaction?.idinterno });
    console.log("searchReservacionporcliente1", searchReservacionporcliente);
    if (searchReservacionporcliente) {
      //const searchReservacion = await ReservationXCliente.findByIdAndDelete(searchReservacionporcliente._id);
      const searchReservacion = await Reservation.findById(searchReservacionporcliente.reservation);
      console.log("searchReservacion", searchReservacion);
      if (searchReservacion) {
        //console.log("Id reser", searchReservacion._id);
        const searchReservacionxclientes = await ReservationXCliente.find({ reservation: searchReservacion?._id });
        //console.log("searchReservacionxclientes2", searchReservacionxclientes);
        if (searchReservacionxclientes.length == 1) {
          console.log("Eliminando reservacion ", searchReservacion._id);
          const deleteresa = await Reservation.findByIdAndDelete(searchReservacion._id);
          console.log("Eliminando reservacion ", deleteresa);
          const deleteresaporcliente = await ReservationXCliente.findByIdAndDelete(searchReservacionporcliente._id);
          console.log("Eliminando reservacion ", deleteresaporcliente);
        }
        else {
          //console.log("No se elimina reservacion ", searchReservacion._id);
          var newbooked = searchReservacion.participantsbooked - searchReservacionporcliente.players;
          var newavailible = searchReservacion.availableparticipants + searchReservacionporcliente.players;
          searchReservacion.booked = newbooked;
          searchReservacion.available = newavailible;
          console.log("newbooked", newbooked, "newavailible", newavailible);
          await searchReservacion.save();
          await ReservationXCliente.findByIdAndDelete(searchReservacionporcliente._id);

        }
      }
    }
      
    res.json(searchTransaction); // Respond with the deleted transaction
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transaction" });
  }
});

module.exports = router;
