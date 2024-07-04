// auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
    const header = req.header('Authorization') || '';
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Token not provided or invalid format' });
    }
    const token = parts[1];
    try {
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        req.username = payload.username;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token not valid' });
    }
}

module.exports = verifyToken;