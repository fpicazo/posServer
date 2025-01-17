const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Reservation = require('../models/Reservation');
const ReservationCourse = require('../models/reservationCourseModel')
const Branches = require('../models/branchesModel');
const stripe = require('stripe')(process.env.STRIPE_SECR_LIVE);
const stripeSuc = require('stripe');



  router.post('/', async (req, res) => {
    const session_id = req.body.sessionid;
    const amount = req.body.amount;
    const articulos = req.body.articulos;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      allow_promotion_codes:true,
      line_items: [{
        price_data: { 
          currency: 'mxn',
          product_data: { 
            name: articulos, 
          },
          unit_amount: amount * 100,  
        },
        quantity: 1, 
      }],
      metadata: {
        orderId: session_id.toString(),
      },
      mode: 'payment',
      success_url:  process.env.BASE_URL + "/#/success?session_id=" + session_id,
      cancel_url: process.env.BASE_URL + '/#/cancel?session_id=' + session_id,
    });
    // await Reservation.findOneAndUpdate( { _id: session_id }, { idSessionStripe: session.id });
    res.json({ id: session.id, url: session.url }); 
  });


  router.get('/stripe_session', async (req, res) => {
    const idsession = req.query.session_id;
    const bucqueda = await Reservation.findById(idsession);

    const session = await stripe.checkout.sessions.retrieve(bucqueda.idSessionStripe, {
      expand: ['total_details.breakdown']
    });
    const amount_total = session.amount_subtotal;
    const amount_final = session.amount_total;
    const descuento = parseFloat(((1 - (amount_final / amount_total))*100 ).toFixed(2));
    const couponName = session.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.name;
    const json = { amount_total, amount_final, descuento, couponName };
    res.json(json);
  }
  );


  router.get('/payment-intent', async (req, res) => {
    const { idpayment } = req.query;

    const paymentIntent = await stripe.paymentIntents.retrieve(idpayment);
    res.json(paymentIntent); 
  }
  );



  
  const getStripeInstance = async( _id ) => {

    let stripeSecretKey = ''
    if( _id === '6735e8fe3cbf3096493afa5e' ){
      stripeSecretKey = process.env.STRIPE_SECRET_PRUEBA_PUVA;
    }else if( _id === '6767682b3b3a0a728a7025f6' ){
      stripeSecretKey = process.env.STRIPE_SECRET_PRUEBA_GUA;
    }
    return stripeSuc(stripeSecretKey);

  };

  router.post('/curso', async (req, res) => {
    try{

      const { idBrance, articulo, amount, reservation } = req.body;

      // console.log(JSON.stringify(reservation));
      

      const reservationCourse = ReservationCourse({
        players: reservation.players,
        date: convertToLocalTime(reservation.date),
        course: reservation.course,
        location: reservation.location,
        startDate: convertToLocalTime(reservation.startDate),
        endDate: convertToLocalTime(reservation.endDate),
        client: reservation.client,
        contactPhone: reservation.contactPhone,
        contactEmail: reservation.contactEmail,
        contactName: reservation.contactName,
        status: reservation.status
      });
      const savedReservation = await reservationCourse.save();

      const branche = await Branches.findById(idBrance);
      const stripeSucFinal = await getStripeInstance( branche._id.toString() );
      const session = await stripeSucFinal.checkout.sessions.create({
        payment_method_types: ['card'],
        allow_promotion_codes:true,
        line_items: [{
          price_data: { 
            currency: 'mxn',
            product_data: { 
              name: articulo, 
            },
            unit_amount: amount * 100
          },
          quantity: 1, 
        }],
        metadata: {
          orderId: savedReservation._id.toString(),
        },
        mode: 'payment',
        success_url:  process.env.BASE_URL + "/success/" + savedReservation._id.toString()
        // cancel_url: process.env.BASE_URL + '/#/cancel?session_id=' + orderId,
      });

      
      // console.log({ id: session.id, url: session.url });
      res.json({ url: session.url });

    }
    catch( error ){
      console.error(error);
    }

  });

  

  const convertToLocalTime = (date) => {
    const localDate = new Date(date);
    const offset = localDate.getTimezoneOffset() * 60000; // Obtener el offset en milisegundos
    return new Date(localDate.getTime() - offset); // Convertir a la zona horaria local
  };

  


module.exports = router;




    // const session_id = req.body.sessionid;
    // const amount = req.body.amount;
    // const articulos = req.body.articulos;
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   allow_promotion_codes:true,
    //   line_items: [{
    //     price_data: { 
    //       currency: 'mxn',
    //       product_data: { 
    //         name: articulos, 
    //       },
    //       unit_amount: amount * 100,  
    //     },
    //     quantity: 1, 
    //   }],
    //   metadata: {
    //     orderId: session_id.toString(),
    //   },
    //   mode: 'payment',
    //   success_url:  process.env.BASE_URL + "/#/success?session_id=" + session_id,
    //   cancel_url: process.env.BASE_URL + '/#/cancel?session_id=' + session_id,
    // });
    // await Reservation.findOneAndUpdate( { _id: session_id }, { idSessionStripe: session.id });
    // res.json({ id: session.id, url: session.url });