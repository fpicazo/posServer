const express = require('express');
const router = express.Router();
const Product = require('../models/ProductModel');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});  

// Update a product by ID
router.put('/:id', async (req, res) => {
    //console.log("ID " + req.params);

    try {
        const { id } = req.params;
    
        const { nameProduct, price } = req.body;
        const product = await Product.findByIdAndUpdate(
            id, 
            { nameProduct, price }, 
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
