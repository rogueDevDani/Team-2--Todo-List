// server.js (or app.js)

const express = require('express');
const cors = require('cors'); // <--- 1. Import CORS
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

// Essential: Middleware for reading JSON data from POST requests
app.use(express.json());

// 2. Configure CORS middleware (The Fix!)
// Explicitly allow requests only from your frontend URL
const frontendURL = 'http://localhost:4200'; 

app.use(cors({
    // Set the specific origin to allow
    origin: frontendURL, 
    // You can also list the methods you allow
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    // Necessary if you use cookies or authorization headers
    credentials: true 
}));

// ... Your routes go here (e.g., app.post('/todos', ...)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Your PostgreSQL connection check
});