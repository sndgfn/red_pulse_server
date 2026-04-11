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
let requiestBloodCollection;


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
        requiestBloodCollection = db.collection("request_blood");


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


// GET a single user by email
app.get('/users/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "User not found in database" });
        }
        res.send(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


//  blood requiest apis 
// POST: Create a new blood request
app.post('/request-blood', async (req, res) => {
    try {
        const requestData = req.body;
        if (!requestData.requestedBy || !requestData.requestedTo) {
            return res.status(400).send({ success: false, message: "Missing required emails." });
        }
        if (requestData.requestedBy === requestData.requestedTo) {
            return res.status(400).send({ success: false, message: "You cannot request blood from yourself." });
        }
        const existing = await requiestBloodCollection.findOne({
            requestedBy: requestData.requestedBy,
            requestedTo: requestData.requestedTo,
            status: 'pending'
        });
        if (existing) {
            return res.status(409).send({ success: false, message: "A pending request already exists for this donor." });
        }
        const result = await requiestBloodCollection.insertOne(requestData);
        res.status(201).send({
            success: true,
            message: "Request created successfully",
            insertedId: result.insertedId
        });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
});




// sob ceye jamelar api 
app.get('/request-blood/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const emailRegex = new RegExp(`^${email}$`, 'i');

       
        const query = {
            $or: [
                { requestedTo: { $regex: emailRegex } },
                { 
                    $and: [
                        { requestedBy: { $regex: emailRegex } },
                        { status: "accepted" }
                    ]
                }
            ]
        };

        const requests = await requiestBloodCollection
            .find(query)
            .sort({ createdAt: -1 }) // Sort by newest first
            .toArray();

        // Always return an array, even if empty, to prevent frontend crashes
        res.status(200).send(requests || []);

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/request-blood/accept/:id', async (req, res) => {

  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Request ID format.' });
    }

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        status: 'accepted',
        updatedAt: new Date().toISOString()
      }
    };

    const result = await requiestBloodCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // optional: fetch updated document
    const updated = await requiestBloodCollection.findOne(filter);

    res.status(200).json({
      success: true,
      message: 'Blood request accepted successfully!',
      modifiedCount: result.modifiedCount,
      request: updated
    });
  } catch (error) {
    console.error('❌ Update Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
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





















































