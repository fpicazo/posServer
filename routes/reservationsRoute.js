const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Client = require('../models/Client');
const ReservationXCliente = require('../models/ReservationXCliente');
const moment = require('moment-timezone');
const catalogoJuegos = require('../configuration/maxplayers');
const { updateTokenHour } = require('../utils/checkAndRefreshToken');
const axios = require('axios');


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
  console.log(req.body);
  try {
    const { phone, firstName, lastName, email, date, players, location } = req.body;
    var game = req.body.game;
    var clientId = req.body.clientId;

    const startDate = moment.tz(date, "America/Mexico_City").toDate();
    const endDate = moment.tz(date, "America/Mexico_City").add(20, 'minutes').toDate(); // Add 20 minutes to startDate
    //console.log("startDate " + startDate);
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
    console.log("game " + game);

    var maxClients = catalogoJuegos.find(juego => juego.name === game).maxPlayers;

    const newReservation = new Reservation({
      date,
      location,
      participantsbooked: players,
      availableparticipants: maxClients - players,
      startDate,
      endDate,
      game,
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
    });

    console.log("New reservation cliente " + newReservationXCliente);

    await newReservationXCliente.save();

    res.status(201).json(newReservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding Reservation" });
  }
});


router.post('/block', async (req, res) => {
  console.log(req.body);
  const { status, date,startDate ,endDate, comment,location } = req.body;
 
  const startTime = moment.tz(startDate, "America/Mexico_City");
  const endTime = moment.tz(endDate, "America/Mexico_City");
  const dateFormatted = moment.tz(startDate, "America/Mexico_City").format("YYYY-MM-DD");

  
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


// GET route to fetch all notes
router.get('/avaibility', async (req, res) => {
  const { date, location, status,game } = req.query; // "YYYY-MM-DD"
  console.log(req.query);

  let startOfDay = moment.tz(`${date} 11:00`, "America/Mexico_City");
  let endOfDay = moment.tz(`${date} 21:00`, "America/Mexico_City");
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
    for (let time = moment(startOfDay); time.isBefore(endOfDay); time.add(20, 'minutes')) {
      slots.push(time.format("HH:mm")); // Adjusting to output only the time part
    }

    // Filter out slots that are taken
    const availableSlots = slots
    .filter((slot, index, self) => self.indexOf(slot) === index)
    .map(slot => {
      const slotTime = moment.tz(`${date} ${slot}`, "America/Mexico_City");
      const reservation = reservations.find(reservation => {
        const reservationStart = moment.tz(reservation.startDate, "America/Mexico_City").format("HH:mm");
        const reservationEnd = moment.tz(reservation.endDate, "America/Mexico_City").format("HH:mm");
        return slotTime.isBetween(moment.tz(reservation.startDate, "America/Mexico_City"), moment.tz(reservation.endDate, "America/Mexico_City"), null, '[)');
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

  const query = {};

  // Set startDate to provided value or today's date if not provided
  if (startDate) {
    const startOfDay = moment(startDate).startOf('day').toDate();
    const endOfDay = moment(startDate).endOf('day').toDate();
    query.startDate = { $gte: startOfDay, $lte: endOfDay };
  } else {
    // If startDate is not provided, use today's date
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    query.startDate = { $gte: todayStart, $lte: todayEnd };
  }

  try {
    const reservations = await Reservation.find(query);
    
    // Add the 'time' field to each reservation
    const reservationsWithTime = reservations.map(reservation => ({
      ...reservation.toObject(),
      time: moment(reservation.startDate).format('HH:mm')
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

// PUT route to update a note
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  console.log(req.body);
    const { phone, firstName, lastName, email } = req.body;
  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
        id, 
        { phone, firstName, lastName, email },
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
  const { status } = req.body;
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

    if (!updatedReservation) {
      return res.status(404).json({ message: "Reservation not found222" });
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