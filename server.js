const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // <-- 1. Import PostgreSQL Pool
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

// =======================================================
// 2. DATABASE CONFIGURATION
// =======================================================
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the database connection
pool.connect()
    .then(client => {
        console.log('✅ Connected to PostgreSQL');
        client.release();
    })
    .catch(err => {
        console.error('❌ Error connecting to PostgreSQL:', err.stack);
    });


// =======================================================
// 3. MIDDLEWARE SETUP
// =======================================================

// Essential: Middleware for reading JSON data from POST requests
app.use(express.json());

// Configure CORS middleware to allow the Angular frontend on port 4200
const frontendURL = 'http://localhost:4200'; 

app.use(cors({
    origin: frontendURL, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true 
}));


// =======================================================
// 4. API ROUTES (CRUD)
// =======================================================

// A. READ Route: Fetch all To-Do items
app.get('/todos', async (req, res) => {
    try {
        // !!! IMPORTANT: Replace 'todos' with your actual PostgreSQL table name !!!
        const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
        
        // Send the list of tasks back to the frontend
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error("Error fetching todos:", err);
        res.status(500).json({ error: 'Failed to retrieve todo list' });
    }
});

// B. CREATE Route: Add a new To-Do item
app.post('/todos', async (req, res) => {
    const { text } = req.body; // Assuming the frontend sends { text: "new todo item" }

    if (!text) {
        return res.status(400).json({ error: 'To-Do item text is required.' });
    }

    try {
        // !!! IMPORTANT: Replace 'todos' with your actual PostgreSQL table name !!!
        // Note: You must update the column names if yours are different
        const query = 'INSERT INTO todos(text, completed) VALUES($1, $2) RETURNING *';
        const values = [text, false]; 
        
        const result = await pool.query(query, values);
        
        // Send the newly created item back to the frontend
        res.status(201).json(result.rows[0]);
        
    } catch (err) {
        console.error("Error creating todo:", err);
        res.status(500).json({ error: 'Failed to create todo item' });
    }
});


// =======================================================
// 5. START SERVER
// =======================================================

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});