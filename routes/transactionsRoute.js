const express = require('express');
const router = express.Router();
const Transactions = require('../models/Transaction');
const Client = require('../models/Client');

// POST route to add a new note
router.post('/', async (req, res) => {
  try {

    
    const { amount,concept, client, paymentMode,sessionid,cortesiaMotivo,cortesiaRango,nameUserCortesia } = req.body;
    let { date } = req.body; // Declare date with let so it can be reassigned
    
    // Check if date is not provided and assign the current date to it
    if (!date) {
      date = new Date();
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
        case 'Cabinas Inmersivas':
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
      nameUserCortesia



        });

        await newTransaction.save();

    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding Transaction" });
  }
});

// GET route to fetch all notes
router.get('/', async (req, res) => {
  try {
      const transactions = await Transactions.find().sort({ createdAt: -1 }); // replace `createdAt` with your date field
      res.json(transactions);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching Transaction" });
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
  try {
    const { id } = req.params;
    const transaction = await Transactions.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({ message: "transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transaction" });
  }
}
);

module.exports = router;
