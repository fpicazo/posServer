const express = require('express');
const router = express.Router();
const Product = require('../models/ProductModel');
const Users = require('../models/Users');
const Profiles = require('../models/profilesModel');

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


router.post('/', async (req, res) => {
    try {
        const { nameProduct, price, type, image } = req.body;

        const product = Product({ nameProduct, price, type, image, quantity: 0 });
        await product.save();

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});



router.put('/', async (req, res) => {
    try {
        const { _id, nameProduct, price, type, image } = req.body;

        await Product.findByIdAndUpdate(_id, { nameProduct, price, type, image });

        res.status(200).json({ menaje: 'ok' });
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
    
        const { nameProduct, price, image } = req.body;
        const product = await Product.findByIdAndUpdate(
            id, 
            { nameProduct, price, image }, 
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


// Get all products
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const users = await Users.findById(id);
        
        if( users.role !== 'user' ){
            const products = await Product.find({});
            res.status(200).json(products);
        }else{
            const profiles = await Profiles.find({ _id: users.perfil });
            res.status(200).json( profiles[0].selectProducts );
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});  

module.exports = router;
