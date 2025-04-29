const express = require('express');
const router = express.Router();
const Transactions = require('../models/Transaction');
const TransactionEliminadas = require('../models/TransactionEliminadas');
const Reservation = require('../models/Reservation');
const ReservationXCliente = require('../models/ReservationXCliente');

const Product = require('../models/ProductModel');

const Client = require('../models/Client');
const Types = require('../models/typesModel');
const moment = require('moment-timezone');
const Timezone = "America/Hermosillo";

const Branches = require('../models/branchesModel');

// POST route to add a new note
router.post('/', async (req, res) => {
  console.log("New transaccion", req.body);
  try {

    
    const { amount, client, paymentMode,sessionid,cortesiaMotivo,cortesiaRango,nameUserCortesia,idinterno,cupon,discount, tc, sucursal } = req.body;
    // console.log("BODY new transaccion ", req.body);
    var concept = req.body?.concept;
    let { date } = req.body; // Declare date with let so it can be reassigned

    // console.log( ' ------------------------------------------------------ ', concept );
    
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
      return `${product.nameProduct} - ${product.quantity} - $${amount}`;
    }).join(' || ');
    // console.log("productPhrases2", productPhrases);


     // Initialize variables to store aggregated values
     let campobatallamoney = 0, campobatallaqty = 0, campobatallatotal = 0;
     let juegosmoney = 0, juegosqty = 0, juegostotal = 0;
     let cabinamoney = 0, cabinaqty = 0, cabinatotal = 0;
     let tarjetamoney = 0, tarjetaqty = 0, tarjetatotal = 0, andadormoney = 0, andadorqty = 0, promocionmoney = 0, promocionqty = 0, promociontotal = 0,
     andadortotal = 0, eventosmoney = 0, eventosqty = 0, eventostotal = 0 , peluchemoney = 0, pelucheqty = 0, peluchetotal = 0;

    concept.forEach(product => {

      console.log("product + ", product);
      const { nameProduct, price, quantity, type } = product;
      const total = price * quantity;

      switch (type) {
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
          case 'Peluche':
          peluchemoney += price;
          pelucheqty += quantity;
          peluchetotal += total;

          break;
          case 'Promocion':
          promocionmoney += price;
          promocionqty += quantity;
          promociontotal += total;
          break;
        default:
          console.log(`Product ${type} does not match any category.`);
      }
      // console.log("cabinatotal + ", cabinatotal);
    });

    // campobatallamoney += price;
    // campobatallaqty += quantity;
    // campobatallatotal += total;

    let concepts = [];
    concept.forEach(product => {

      // console.log("product + ", product);
      const { _id, nameProduct, price, quantity, type } = product;
      const total = price * quantity;

      concepts = [ ...concepts, {
        id: _id,
        type,
        money: price,
        qty: quantity,
        total: total
      }]
      
    });

    const branches = await Branches.findById(sucursal);
    const newTransaction = new Transactions({
      date,
      amount,
      concept:productPhrases,
      concepts: concepts,
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
      peluchemoney,
      pelucheqty,
      peluchetotal,
      promocionmoney,
      promocionqty,
      promociontotal,
      cortesiaMotivo,
      cortesiaRango,
      nameUserCortesia,
      idinterno,
      cupon,
      discount,
      tc: tc,
      sucursal: sucursal,
      currency: branches.currency


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
  var { branches } = req.query;

  try {
    const branchFilter = branches && branches.length > 0 ? { sucursal: { $in: branches } } : {};
    const summary = await Transactions.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo, $lte: new Date() },
          modo: "pos",
          ...branchFilter
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
  var { branches } = req.query;
  console.log( startDate );
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

  // Branch filter - Add to query if branches are provided
  if (branches && branches.length > 0) {
    query.sucursal = { $in: branches };  // Filter by branches (sucursal)
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
  var { branches } = req.query;
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

  if (branches && branches.length > 0) {
    query.sucursal = { $in: branches };  // Filter by branches (sucursal)
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
    console.log("RAZ " + razonEliminacion)
    searchTransaction.razonEliminacion = razonEliminacion;
    console.log("searchTransaction", searchTransaction);

    // Create a new document in the TransactionEliminadas collection
    const newTransactionEliminadas = new TransactionEliminadas(searchTransaction.toObject());
    console.log("New transaction to delete " + newTransactionEliminadas);
    await newTransactionEliminadas.save(); 
 
    // Delete the transaction from the Transactions collection
    const transaction = await Transactions.findByIdAndDelete(id);
   console.log("idinterno", searchTransaction?.idinterno ); 
   if (!searchTransaction?.idinterno) {
    return res.json({ message: "idinterno not found" });
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



// -------------------------------

router.post('/transparam', async(req, res) => {

  try 
  {
    const { startDate, endDate, arrayScucursales } = req.body;

    // console.log( startDate, endDate, arrayScucursales );

    const startDateF = new Date(`${startDate}T00:00:00Z`);  // Asegúrate de que es UTC si lo necesitas
    const endDateF = new Date(`${endDate}T23:59:59Z`);   

    let transactions = await Transactions.find({
      createdAt: {
        $gte: startDateF,
        $lte: endDateF
      },
      $or: [
        { sucursal: { $in: arrayScucursales } },
        { sucursal: { $exists: false } }  // Documentos sin el campo 'sucursal'
      ]
    }).sort({ createdAt: -1 });

    const types = await Types.find({});
    let encabezadosTipos = [];

    for (const r of types.sort((a, b) => a.order - b.order)) {
      if (r.type === 'Promocion') {
        const prod = await Product.find({ type: 'Promocion' });
        for (const dt of prod) {
          encabezadosTipos.push({
            id: `${dt._id}`,
            tipo: r.type,
            cantidad: `${dt.nameProduct} Cantidad`,
            precio: `${dt.nameProduct} Precio`,
            total: `${dt.nameProduct} Total`
          });
        }
      } else {
        encabezadosTipos.push({
          tipo: r.type,
          cantidad: `${r.type} Cantidad`,
          precio: `${r.type} Precio`,
          total: `${r.type} Total`
        });
      }
    }


    let fetchedTransaccionesNew = [];
    transactions.map( ( row ) => {
        let fila = {};

        fila._id = row._id;
        fila.location = row.location;
        fila.date = row.date;
        fila.amount = row.amount;

        if( row.concepts.length > 0 ){
          
          encabezadosTipos.map( ( a ) => {
          
            if( a.tipo === 'Promocion' ){

              let cuenta = row.concepts.filter( x => x.type === a.tipo && x.id === a.id );
              if( cuenta.length > 0 ){
                
                const totalQty = cuenta.reduce((acc, cur) => acc + cur.qty, 0);
                const totalMoney = cuenta.reduce((acc, cur) => acc + cur.money, 0);
                const totalTotal = cuenta.reduce((acc, cur) => acc + cur.total, 0);

                fila[a.cantidad] = totalQty;
                fila[a.precio] = totalMoney;
                fila[a.total] = totalTotal;

              }else{

                fila[a.cantidad] = 0;
                fila[a.precio] = 0;
                fila[a.total] = 0;

              }

            }else{

                let cuenta = row.concepts.filter( x => x.type === a.tipo );
                
                if( cuenta.length > 0 ){
                  
                  const totalQty = cuenta.reduce((acc, cur) => acc + cur.qty, 0);
                  const totalMoney = cuenta.reduce((acc, cur) => acc + cur.money, 0);
                  const totalTotal = cuenta.reduce((acc, cur) => acc + cur.total, 0);
                  
                  fila[a.cantidad] = totalQty;
                  fila[a.precio] = totalMoney;
                  fila[a.total] = totalTotal;

                }else{
                  
                  fila[a.cantidad] = 0;
                  fila[a.precio] = 0;
                  fila[a.total] = 0;

                }

              }

            } );


        }else{

          fila['Campo de Batalla Cantidad'] = row.campobatallaqty;
          fila['Campo de Batalla Precio'] = row.campobatallamoney;
          fila['Campo de Batalla Total'] = row.campobatallatotal;

          fila['Maquinas Cantidad'] = row.juegosqty;
          fila['Maquinas Precio'] = row.juegosmoney;
          fila['Maquinas Total'] = row.juegostotal;

          fila['Cabinas Inmersivas Cantidad'] = row.cabinaqty;
          fila['Cabinas Inmersivas Precio'] = row.cabinamoney;
          fila['Cabinas Inmersivas Total'] = row.cabinatotal;

          fila['Tarjeta Cantidad'] = row.tarjetaqty;
          fila['Tarjeta Precio'] = row.tarjetamoney;
          fila['Tarjeta Total'] = row.tarjetatotal;

          fila['Andador Virtual Cantidad'] = row.andadorqty;
          fila['Andador Virtual Precio'] = row.andadormoney;
          fila['Andador Virtual Total'] = row.andadortotal;

          fila['Eventos Cantidad'] = row.eventosqty;
          fila['Eventos Precio'] = row.eventosmoney;
          fila['Eventos Total'] = row.eventostotal;

          fila['Peluche Cantidad'] = row.pelucheqty;
          fila['Peluche Precio'] = row.peluchemoney;
          fila['Peluche Total'] = row.peluchetotal;

          fila['Promociones Cantidad'] = row.promocionqty;
          fila['Promociones Precio'] = row.promocionmoney;
          fila['Promociones Total'] = row.promociontotal;

          fila['Escape Cantidad'] = row.escapeqty;
          fila['Escape Precio'] = row.escapemoney;
          fila['Escape Total'] = row.escapetotal;

          fila['Alimentos Cantidad'] = 0;
          fila['Alimentos Precio'] = 0;
          fila['Alimentos Total'] = 0;

          fila['Bebidas Cantidad'] = 0;
          fila['Bebidas Precio'] = 0;
          fila['Bebidas Total'] = 0;



        }

        fila.idinterno = row.idinterno;
        fila.session = row.session;
        fila.tc = row.tc;
        fila.sucursal = row.sucursal;
        fila.paymentMode = row.paymentMode;
        fila.client = row.client;
        fetchedTransaccionesNew = [ ...fetchedTransaccionesNew, fila ];

      } );
    
    res.json(fetchedTransaccionesNew);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});



router.get('/products', async(req, res) => {

  try 
  {
    
    const prod = await Product.find();
    
    res.json(prod);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

module.exports = router;
