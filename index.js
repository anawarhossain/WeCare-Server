const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_WE_CARE_CONNECT_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB successfully!");
    const database = client.db("WeCareDB");

    // const doctorCollection = client.db("WeCareDB").collection("doctors");
    const doctorCollection = database.collection("doctors");

    // Root
    app.get("/", (req, res) => {
      res.json({ message: "WeCare API is running 🚀" });
    });
    

    // Get a single doctor by userId
    app.get("/api/doctors/:userId", async (req, res) => {
      const doctor = await doctorCollection.findOne({
        userId: req.params.userId,
      });
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });
      res.json(doctor);
    });

    // Create a new doctor profile
    app.post("/api/doctors", async (req, res) => {
      const result = await doctorCollection.insertOne(req.body);
      res.status(201).json(result);
    });

    // Update an existing doctor profile
    app.put("/api/doctors/:id", async (req, res) => {
      const updatedData = { ...req.body };
      delete updatedData._id; // MongoDB does not allow updating the _id field

      const result = await doctorCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updatedData },
      );
      res.json(result);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

run();

app.listen(port, () => {
  console.log(`🚀 WeCare server running on http://localhost:${port}`);
});
