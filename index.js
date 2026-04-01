
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dns = require("node:dns");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
dns.setServers(["0.0.0.0", "1.1.1.1"]);

// MIDDLEWARE
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
let userCollection;

// MONGODB CONNECTION
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
app.get('/test', (req, res) => {
    res.send("Server is reachable!");
});
async function run() {
    try {
        console.log("✅ Red Pulse connected to MongoDB");
        const db = client.db("red_pulse");

         userCollection = db.collection("users");


    } catch (error) {
        console.error("❌ Startup Error:", error);
    } finally {
        // Keep connection open
    }
}

run().catch(console.dir);

app.post('/users', async (req, res) => {
    try {
        const user = req.body;

        // Check if user already exists
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);

        if (existingUser) {
            return res.status(200).send({ message: 'user already exists', insertedId: null });
        }

        const result = await userCollection.insertOne(user);
        res.status(201).send(result);
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).send({ message: "Failed to save user to database" });
    }
});

// GET API: Retrieve all users
app.get('/users', async (req, res) => {
    try {
        if (!userCollection) {
            return res.status(503).send({ 
                message: "Database connection not established yet. Please try again in a moment." 
            });
        }
        const users = await userCollection.find({}).toArray();
        console.log(`Successfully retrieved ${users.length} users.`);
        res.status(200).send(users);

    } catch (error) {
        console.error("Error fetching users from MongoDB:", error);
        res.status(500).send({ 
            message: "Internal Server Error: Failed to retrieve users",
            error: error.message 
        });
    }
});







// TEST ROUTE
app.get('/', (req, res) => {
    res.send('Red Pulse Server is Pulse-ing! 🩸');
});

// START SERVER
app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://192.168.0.102:${port}`);
});
//test github