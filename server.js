const express = require('express');
const cors = require('cors');
const pool = require('./dbpool');

const app = express();
app.use(cors());
app.use(express.json());

// TEST ENDPOINT
app.get('/', (req, res) => {
    res.send("Backend is running!");
});

// Example CRUD endpoint (READ)
app.get('/api/items', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM items");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port 3000`);
});
