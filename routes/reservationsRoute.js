const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Client = require('../models/Client');
const ReservationXCliente = require('../models/ReservationXCliente');
const Chekin = require('../models/checkinModel');
const moment = require('moment-timezone');
const catalogoJuegos = require('../configuration/maxplayers');
const { updateTokenHour } = require('../utils/checkAndRefreshToken');
const axios = require('axios');
const Timezone = "America/Hermosillo";

const ReservationCourse = require('../models/reservationCourseModel');


const createPaymentLink = async (res, data) => {
  try {
    const { lastTokenHour, token } = await updateTokenHour(); // Ensure updateTokenHour returns an object with these properties
    console.log("token " + token);
    const url = 'https://books.zoho.com/api/v3/paymentlinks?organization_id=719250654';
    amount = req.body.cashAmount + req.body.cardAmount;
    
    const dataObject = {  // Directly construct the object to be sent
        "customer_id": "2301987000013004060",
        "line_items": [
            {
                "item_id": "2301987000013004043",
                "rate": amount,  // Assuming rate should be a number
                "quantity": 1   // Assuming quantity should be a number
            }
        ]
    };

    const headers = {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'X-Zoho-Organization-Id': "719250654"  // Correct header if required
    };

    // Make sure to pass the actual data object and configure headers properly
    const response = await axios.post(url, dataObject, { headers: headers });
    res.json(response.data); // Send back the API response to the client
} catch (error) {
    console.error(error.response.data);
    res.status(500).json({ message: "Error processing the request" });  // Send back a generic error message
}
};


// POST route to add a new note
router.post('/', async (req, res) => {

  console.log("New reservacion" + req.body);
  
  try {

    const { phone, firstName, lastName, email, date,time, players, amountIndiv,idinterno } = req.body;
    console.log("date " + date);
    let game = req.body.game;
    let clientId = req.body.clientId;
    let status = "pending";
    let modo = req.body.modo;
    let location = req.body.location;
    let startDate;
    if (!location) {
      location = "Tepic";
    }


    if (!time) {

      startDate = moment.tz(date, Timezone).toDate();

    } else {

      const dateTimeString = `${date} ${time}`;
      console.log("dateTimeString " + dateTimeString);
      startDate = moment.tz(dateTimeString, Timezone).toDate();

    }

    console.log("startDate " + startDate);
    const endDate = moment.tz(startDate, Timezone).add(30, 'minutes').toDate(); // Add 30 minutes to startDate

    let existingClient;
    if (clientId) {
      existingClient = await Client.findById(clientId);
    } else {
      existingClient = await Client.findOne({
        $or: [
          { phone: phone },
          { email: email }
        ]
      });
    }

    console.log("search existing client " + existingClient);
    if (!existingClient && !clientId) {
      const newClient = new Client({
        phone,
        firstName,
        lastName,
        email,
      });
      await newClient.save();
      clientId = newClient._id;
    } else {
      clientId = existingClient ? existingClient._id : clientId;
    }

    if (!game) {
      game = "Rancho Embrujado";
    }

    if (!modo || modo !== "online") {
      modo = "pos";
      status = "booked";
    }
    console.log("game " + game);

    const maxClients = 50;

    console.log("StartDate " + startDate);

    // Check if reservation exists
    let existingReservation = await Reservation.findOne({ startDate, location });

    if (!existingReservation) {
      // Create new reservation if it doesn't exist
      const newReservation = new Reservation({
        date,
        location,
        participantsbooked: players,
        availableparticipants: maxClients - players,
        startDate,
        endDate,
        game,
        amountIndiv,
        modo,
        idinterno,
      });

      console.log(newReservation);
      await newReservation.save();

      const newReservationXCliente = new ReservationXCliente({
        players,
        date,
        location,
        startDate,
        endDate,
        game,
        client: clientId,
        reservation: newReservation._id,
        amountIndiv,
        modo,
        status: status,
        idinterno,
      });

      console.log("New reservation cliente " + newReservationXCliente);
      const createreservacioncliente = newReservationXCliente.save();
      console.log("New reservation cliente220 " + createreservacioncliente);

      res.status(201).json(newReservation);
    } else {

      // Update existing reservation if it exists
      const newPlayersNumber = existingReservation.participantsbooked + players;
      existingReservation = await Reservation.findByIdAndUpdate(
        existingReservation._id,
        {
          participantsbooked: newPlayersNumber,
          availableparticipants: maxClients - newPlayersNumber
        },
        { new: true }
      );

      const newReservationXCliente = new ReservationXCliente({
        players,
        date,
        location,
        startDate,
        endDate,
        game,
        client: clientId,
        reservation: existingReservation._id,
        amountIndiv,
        modo,
        status: status,
        idinterno,
      });

      console.log("Updated reservation cliente " + newReservationXCliente);
      const createreservacioncliente = await newReservationXCliente.save();
      console.log("Updated reservation cliente2 " + createreservacioncliente);

      res.status(200).json(existingReservation);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding Reservation" });
  }
  
});


router.post('/block', async (req, res) => {
  console.log(req.body);
  const { status, date,startDate ,endDate, comment,location } = req.body;
 
  const startTime = moment.tz(startDate, Timezone);
  const endTime = moment.tz(endDate, Timezone);
  const dateFormatted = moment.tz(startDate, Timezone).format("YYYY-MM-DD");

  
  try {
    const newReservation = new Reservation({
      status,
      date: dateFormatted,
      startDate: startTime.toDate(),
      endDate: endTime.toDate(),
      comment,
      location,
    });

      console.log(newReservation);
      await newReservation.save();

    res.status(201).json(newReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding block reservations" });
  }
});


router.post('/addreservationclient', async (req, res) => {
  console.log(req.body);
  const { players, date, startDate, endDate, location, client } = req.body;

  if (!game) {
    game = "Rancho Embrujado";
  }

  var existingClient = await Client.findOne({ phone: req.body.phone });

    if (!existingClient) {
      const newClient = new Client({
        phone,
        firstName,
        lastName,
        email,
      });
      await newClient.save();
      existingClient = newClient;
    }
   
    const existingReservation = await Reservation.findOne({ date, location, game });

  

  try {
    const newReservationXCliente = new ReservationXCliente({
      players,
      date,
      startDate,
      endDate,
      game,
      location,
      client:existingClient._id,
      reservation: existingReservation._id,
    });

    await newReservationXCliente.save();

    var oldplayersnumber = existingReservation.participantsbooked;
    var newplayersnumber = oldplayersnumber + players;

    await Reservation.findByIdAndUpdate(
      existingReservation._id,
      { participantsbooked: newplayersnumber,availableparticipants: existingReservation.maxPlayers - newplayersnumber},
      { new: true }
    );

    res.status(201).json(newReservationXCliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding reservation" });
  }
});


router.post('/checkin', async (req, res) => {
  //console.log(req.body);
 const {birthDate,email,name,phone,signatureImg,idreservacion } = req.body;
 const gameName = req.body.game.name;
 console.log("gameName " + gameName);
 const gametime = req.body.game.time;
  var location = req.body.location;
  const date = req.body.date;

  if (!location) {
    location = "Tepic";
  }

  payload = {
    "name": name,
    "email": email,
    "phone": phone,
    "birthDate": birthDate,
    "signatureImg": signatureImg,
    "gameName": gameName,
    "gametime": gametime,
    "location": location,
    "date": date,
    idreservacion : idreservacion
  };
try {

  await Chekin.create(payload);
  res.status(201).json(payload);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Error adding checkin" });
}


});


// GET route to fetch all notes
router.get('/avaibility', async (req, res) => {
  const { date, location, status,game } = req.query; // "YYYY-MM-DD"
  console.log(req.query);

  let startOfDay = moment.tz(`${date} 11:00`,Timezone);
  let endOfDay = moment.tz(`${date} 22:00`, Timezone);
  let currentTime = moment.tz(Timezone);
  if (currentTime.isAfter(startOfDay)) {
    startOfDay = currentTime;
    const minutes = startOfDay.minutes();
    if (minutes < 30) {
      startOfDay.minutes(30).seconds(0);
    } 
    //else if (minutes < 40) {
      //startOfDay.minutes(40).seconds(0);    }
       else {
      startOfDay.add(1, 'hour').minutes(0).seconds(0);
    }
  }

  try {
    // Adjusted query to find any reservations overlapping the specified date
    const query = {
      location: location, // Filter by location
      startDate: { $lte: endOfDay.toDate() },
      endDate: { $gte: startOfDay.toDate() },
    }; 

    // Conditionally add the status to the query if it is provided
    if (status) {
      query.status = status;
    }

    console.log("query " + JSON.stringify(query));

    const reservations = await Reservation.find(query);
    console.log("RR " + JSON.stringify(reservations));

    let slots = [];
    for (let time = moment(startOfDay); time.isBefore(endOfDay); time.add(30, 'minutes')) {
      slots.push(time.format("HH:mm")); // Adjusting to output only the time part
    }

    // Filter out slots that are taken
    const availableSlots = slots
    .filter((slot, index, self) => self.indexOf(slot) === index)
    .map(slot => {
      const slotTime = moment.tz(`${date} ${slot}`,Timezone);
      const reservation = reservations.find(reservation => {
        const reservationStart = moment.tz(reservation.startDate, Timezone).format("HH:mm");
        const reservationEnd = moment.tz(reservation.endDate, Timezone).format("HH:mm");
        return slotTime.isBetween(moment.tz(reservation.startDate, Timezone), moment.tz(reservation.endDate, Timezone), null, '[)');
      });
      if (reservation) {
        return {
          time: slot,
          participantsbooked: reservation.status === 'booked' ? reservation.participantsbooked : undefined,
          availableparticipants: reservation.status === 'booked' ? reservation.availableparticipants : undefined,
          game: reservation.game,

        }; 
      } else {
        return { time: slot };
      }
    })
    .sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));

    console.log("AS " + JSON.stringify(availableSlots));
    res.json(availableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
});


// GET route to fetch all notes
router.get('/', async (req, res) => {
  const { startDate } = req.query;
  console.log("startDate " + startDate);

  const query = {};

  // Set startDate to provided value or today's date if not provided
  if (startDate) {
    const startOfDay = moment.tz(startDate, Timezone).startOf('day').toDate();
    const endOfDay = moment.tz(startDate, Timezone).endOf('day').toDate();
    query.startDate = { $gte: startOfDay, $lte: endOfDay };
  } else {
    // If startDate is not provided, use today's date
    const todayStart = moment.tz(Timezone).startOf('day').toDate();
    const todayEnd = moment.tz(Timezone).endOf('day').toDate();
    query.startDate = { $gte: todayStart, $lte: todayEnd };
  }

  console.log("query " + JSON.stringify(query));

 

  try {
    const reservations = await Reservation.find(query);
    console.log("RR / " + JSON.stringify(reservations));
    
    // Add the 'time' field to each reservation
    const reservationsWithTime = reservations.map(reservation => ({
      ...reservation.toObject(),
      time: moment.tz(reservation.startDate,Timezone).format('HH:mm')
    }));

    res.json(reservationsWithTime);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
});


router.get('/blocked', async (req, res) => {
  try {
    const reservations = await Reservation.find({ status: "blocked" });
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching blocked reservations" });
  }
});


router.get('/booked', async (req, res) => {
  try {
    const reservations = await Reservation.find({ status: "booked" });
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching booked reservations" });
  }
});


router.get('/individual', async (req, res) => {
  const { startDate } = req.query;
  if (!startDate) {
    return res.status(400).json({ message: "startDate query parameter is required" });
  }

  console.log("startDate " + startDate);

  const startOfDay = moment(startDate, 'YYYY-MM-DD').startOf('day').toDate();
  const endOfDay = moment(startDate, 'YYYY-MM-DD').endOf('day').toDate();

  try {
    // Fetch reservations within the specified date range
    const reservations = await Reservation.find({
      startDate: { $gte: startOfDay, $lte: endOfDay }
    });
    console.log("Reservacion " + JSON.stringify(reservations));

    // Initialize an array to hold the results
    const results = [];

    // Fetch related ReservationXClientes for each reservation
    for (const reservation of reservations) {
      console.log("Reservacion " + JSON.stringify(reservation._id));
      const reservationClients = await ReservationXCliente.find({ reservation: reservation._id })
        .populate('client', 'firstName lastName');

        //if (reservationClients.status === 'booked') {
      // Initialize an array to hold the ReservationXCliente details
      const reservationClientsDetails = [];

      for (const reservationClient of reservationClients) {
        const client = reservationClient.client;
        if (client) {
          reservationClientsDetails.push({
            reservationClient,
            clientName: `${client.firstName} ${client.lastName}`
          });
        } else {
          reservationClientsDetails.push({
            reservationClient,
            clientName: 'Unknown'
          });
       // }
      }

      // Clone the reservation to avoid mutating the original object
      const reservationClone = reservation.toObject();
      results.push({
        reservation: reservationClone,
        reservationClients: reservationClientsDetails
      });
    }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching individual reservations" });
  }
});



// PUT route to update a note
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  console.log(req.body);
    const { phone, firstName, lastName, email,idSessionStripe, idBranch } = req.body;
  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
        id, 
        { phone, firstName, lastName, email,idSessionStripe, idBranch },
        { new: true }
        );

    if (!updatedReservation) {
        return res.status(404).json({ message: "Reservation not found" });
        }
    


    res.json(updatedReservation);
    } catch (error) {
        res.status(500).json({ message: "Error updating Reservation" });
    }
}
);

router.put('/status/:id', async (req, res) => {
  console.log(req.body );
  const { id } = req.params;
  console.log(id);
  const { status,cupon,discount } = req.body;
  try {
    var updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    console.log("Reserva " + updatedReservation);
    const details = await ReservationXCliente.find({ reservation: id });
    console.log("Details " + JSON.stringify(details));
    console.log(updatedReservation);

    var clientId = details[0].client;
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }


    updatedReservation = updatedReservation.toObject(); // Convert to plain JavaScript object
    updatedReservation.clientName = client.firstName + " " + client.lastName;
    updatedReservation.players = details[0].players;
    updatedReservation.clientId = client.clientId;
    updatedReservation.amount = details[0].amountIndiv;
    updatedReservation.email = client.email;
    updatedReservation.idreservacioncliente = details[0]._id;
    updatedReservation.cupon = details[0].status;
    updatedReservation.date = updatedReservation.date;

    if (!updatedReservation) {
      return res.status(404).json({ message: "Reservation not found222" });
    }

    if (status != 'booked') {
      await ReservationXCliente.findByIdAndDelete(details[0]._id);
    }
    else {
      await ReservationXCliente.findByIdAndUpdate(
        details[0]._id,
        { status: "booked",cupon,discount
        },
        { new: true }
      );
    }


    console.log(updatedReservation);
    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: "Error updating Reservation" });
  }
}
);



// DELETE route to remove a note
router.delete('/:id', async (req, res) => {
  console.log(req.params);
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting reservation" });
  }
}
);



router.post('/curso', async (req, res) => {

  console.log("New reservacion" + req.body);
  
  try {

    const { phone, firstName, lastName, email, date,time, players, amountIndiv,idinterno } = req.body;
    console.log("date " + date);
    let game = req.body.game;
    let clientId = req.body.clientId;
    let status = "pending";
    let modo = req.body.modo;
    let location = req.body.location;
    let startDate;
    if (!location) {
      location = "Tepic";
    }


    if (!time) {

      startDate = moment.tz(date, Timezone).toDate();

    } else {

      const dateTimeString = `${date} ${time}`;
      console.log("dateTimeString " + dateTimeString);
      startDate = moment.tz(dateTimeString, Timezone).toDate();

    }

    console.log("startDate " + startDate);
    const endDate = moment.tz(startDate, Timezone).add(30, 'minutes').toDate(); // Add 30 minutes to startDate

    let existingClient;
    if (clientId) {
      existingClient = await Client.findById(clientId);
    } else {
      existingClient = await Client.findOne({
        $or: [
          { phone: phone },
          { email: email }
        ]
      });
    }

    console.log("search existing client " + existingClient);
    if (!existingClient && !clientId) {
      const newClient = new Client({
        phone,
        firstName,
        lastName,
        email,
      });
      await newClient.save();
      clientId = newClient._id;
    } else {
      clientId = existingClient ? existingClient._id : clientId;
    }

    if (!game) {
      game = "Rancho Embrujado";
    }

    if (!modo || modo !== "online") {
      modo = "pos";
      status = "booked";
    }
    console.log("game " + game);

    const maxClients = 50;

    console.log("StartDate " + startDate);

    // Check if reservation exists
    let existingReservation = await Reservation.findOne({ startDate, location });

    if (!existingReservation) {
      // Create new reservation if it doesn't exist
      const newReservation = new Reservation({
        date,
        location,
        participantsbooked: players,
        availableparticipants: maxClients - players,
        startDate,
        endDate,
        game,
        amountIndiv,
        modo,
        idinterno,
      });

      console.log(newReservation);
      await newReservation.save();

      const newReservationXCliente = new ReservationXCliente({
        players,
        date,
        location,
        startDate,
        endDate,
        game,
        client: clientId,
        reservation: newReservation._id,
        amountIndiv,
        modo,
        status: status,
        idinterno,
      });

      console.log("New reservation cliente " + newReservationXCliente);
      const createreservacioncliente = newReservationXCliente.save();
      console.log("New reservation cliente220 " + createreservacioncliente);

      res.status(201).json(newReservation);
    } else {

      // Update existing reservation if it exists
      const newPlayersNumber = existingReservation.participantsbooked + players;
      existingReservation = await Reservation.findByIdAndUpdate(
        existingReservation._id,
        {
          participantsbooked: newPlayersNumber,
          availableparticipants: maxClients - newPlayersNumber
        },
        { new: true }
      );

      const newReservationXCliente = new ReservationXCliente({
        players,
        date,
        location,
        startDate,
        endDate,
        game,
        client: clientId,
        reservation: existingReservation._id,
        amountIndiv,
        modo,
        status: status,
        idinterno,
      });

      console.log("Updated reservation cliente " + newReservationXCliente);
      const createreservacioncliente = await newReservationXCliente.save();
      console.log("Updated reservation cliente2 " + createreservacioncliente);

      res.status(200).json(existingReservation);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding Reservation" });
  }
  
});



router.get('/reservationcourse/:id', async (req, res) => {
  const { id } = req.params;

  try {
    
    const reservationCourse = await ReservationCourse.findById(id);

    res.json(reservationCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
});


router.get('/todo', async (req, res) => {
  try {
    const reservationCourse = await ReservationCourse.find();
    res.status(200).json( { data: reservationCourse} );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
});


module.exports = router;


/*
// GET route to fetch all notes
router.get('/avaibility', async (req, res) => {
  const { date, location, status } = req.query; // "YYYY-MM-DD"
  console.log(req.query);

  let startOfDay = moment.tz(`${date} 11:00`, "America/Mexico_City");
  let endOfDay = moment.tz(`${date} 20:00`, "America/Mexico_City");
  let currentTime = moment.tz("America/Mexico_City");
  if (currentTime.isAfter(startOfDay)) {
    startOfDay = currentTime;
    const minutes = startOfDay.minutes();
    if (minutes < 20) {
      startOfDay.minutes(20).seconds(0);
    } else if (minutes < 40) {
      startOfDay.minutes(40).seconds(0);
    } else {
      startOfDay.add(1, 'hour').minutes(0).seconds(0);
    }
  }

  try {
    // Adjusted query to find any reservations overlapping the specified date
    const query = {
      location: location, // Filter by location
      startDate: { $lte: endOfDay.toDate() },
      endDate: { $gte: startOfDay.toDate() }
    };

    // Conditionally add the status to the query if it is provided
    if (status) {
      query.status = status;
    }

    console.log("query " + JSON.stringify(query));

    const reservations = await Reservation.find(query);
    console.log("RR " + JSON.stringify(reservations));

    let slots = [];
    for (let time = moment(startOfDay); time.isBefore(endOfDay); time.add(20, 'minutes')) {
      slots.push(time.format("HH:mm")); // Adjusting to output only the time part
    }

    // Filter out slots that are taken
    const availableSlots = slots
      .filter((slot, index, self) => self.indexOf(slot) === index) // Unique times only
      .filter(slot => 
        !reservations.some(reservation => {
          const reservationStart = moment.tz(reservation.startDate, "America/Mexico_City").format("HH:mm");
          const reservationEnd = moment.tz(reservation.endDate, "America/Mexico_City").format("HH:mm");
          const slotTime = moment.tz(`${date} ${slot}`, "America/Mexico_City");
          return slotTime.isBetween(moment.tz(reservation.startDate, "America/Mexico_City"), moment.tz(reservation.endDate, "America/Mexico_City"), null, '[)');
        })
      )
      .map(time => ({ time })) // Map to the desired object format
      .sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm"))); // Sort by time

    console.log("AS " + JSON.stringify(availableSlots));
    res.json(availableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reservations" });
  }
});
*/