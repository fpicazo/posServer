const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const stripe = require('stripe')(process.env.STRIPE_SECR_LIVE);


router.post('/', async (req, res) => {
    console.log(req.body);
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
    console.log(session);
    res.json({ id: session.id }); 
  });


router.get('/stripe_session', async (req, res) => {
    const idsession = req.query.session_id;
    const session = await stripe.checkout.sessions.retrieve(idsession, {
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

module.exports = router;
