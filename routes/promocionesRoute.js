const express = require('express');
const router = express.Router();
const Promociones = require('../models/PromocionesModel');

router.get('/', async (req, res) => {
    var location = req.query.location;
    if (!location) {
        location="Tepic";
    }
    const promociones = await Promociones.find({ location,estado:"activa" });
    res.json(promociones);
}
    
);

router.post('/', async (req, res) => {
    const { monto, conceptos, nombre } = req.body;
    var location = req.body.location;
    if (!location) {
        location="Tepic";
    }

    try {
        const newPromociones = new Promociones({
            location,
            monto,
            conceptos,
            nombre,
            estado:"activa"
        });
        await newPromociones.save();
        res.status(201).json(newPromociones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding promociones" });
    }
}
);

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const promociones = await Promociones.findById(id);
    if (!promociones) {
        return res.status(404).json({ message: "Promociones not found" });
    }
    res.json(promociones);
}
);

router.put('/inactiva/:id', async (req, res) => {
    const { id } = req.params;
    const promociones = await Promociones.findById(id);
    if (!promociones) {
        return res.status(404).json({ message: "Promociones not found" });
    }
    promociones.estado = "inactiva";
    await promociones.save();
    res.json(promociones);
}   
);

router.get('/transactions', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      // Fetch all transactions with promotions within the date range (if provided)
      const transactions = await Transactions.find({
        ...dateFilter,
        promotionDetails: { $exists: true, $not: { $size: 0 } } // Filter transactions with promotions
      });
  
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions with promotions:', error);
      res.status(500).json({ message: 'Error fetching transactions with promotions' });
    }
  });

  router.get('/totals', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
  
      // Aggregate the total amount and quantity by promotion
      const summary = await Transactions.aggregate([
        { $match: { 
            ...dateFilter,
            promotionDetails: { $exists: true, $not: { $size: 0 } } 
          }
        },
        { $unwind: "$promotionDetails" }, // Deconstruct the array field
        { 
          $group: {
            _id: "$promotionDetails.promotionId", // Group by promotion ID
            promotionName: { $first: "$promotionDetails.promotionName" }, // Get the promotion name
            totalQuantity: { $sum: "$promotionDetails.promotionQuantity" }, // Sum quantities
            totalAmount: { $sum: "$promotionDetails.promotionPrice" } // Sum the price
          }
        },
        { $sort: { totalAmount: -1 } } // Sort by total amount in descending order
      ]);
  
      res.status(200).json(summary);
    } catch (error) {
      console.error('Error fetching promotion summary:', error);
      res.status(500).json({ message: 'Error fetching promotion summary' });
    }
  });
   
module.exports = router;



