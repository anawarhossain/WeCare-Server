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
    const usersCollection = database.collection("user");

    // Root
    app.get("/", (req, res) => {
      res.json({ message: "WeCare API is running 🚀" });
    });

    //***********************************************************************************
    //***********************************************************************************
    //***********************************************************************************

    //***********************************************************************************
    // Get all users from the user collection Start
    app.get("/api/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all users from the user collection End
    //***********************************************************************************


    //***********************************************************************************
    // Get all user from the user collection by the role Start
    app.get("/api/users/:role", async (req, res) => {
      try {
        const users = await usersCollection
          .find({ role: req.params.role })
          .toArray();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all user from the user collection by the role End
    //***********************************************************************************
    

    //***********************************************************************************
    // Get all doctors from the doctors collection Start
    app.get("/api/doctors", async (req, res) => {
      try {
        const doctors = await doctorCollection.find().toArray();
        res.json(doctors);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all doctors from the doctors collection End
    //***********************************************************************************

    //***********************************************************************************
    // Get a single doctor profile from the doctors collection by userId Start
    app.get("/api/doctors/user/:userId", async (req, res) => {
      try {
        const doctor = await doctorCollection.findOne({
          userId: req.params.userId,
        });

        if (!doctor) {
          return res.status(404).json({ message: "Doctor not found" });
        }

        res.json(doctor);
      } catch (error) {
        console.error("Error fetching doctor:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get a single doctor profile from the doctors collection by userId End
    //***********************************************************************************

    //***********************************************************************************
    // Create a new doctor profile in the doctors collection Start
    app.post("/api/doctors", async (req, res) => {
      try {
        const result = await doctorCollection.insertOne(req.body);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to create doctor" });
      }
    });
    // Create a new doctor profile in the doctors collection End
    //***********************************************************************************

    //***********************************************************************************
    // Update an existing doctor profile in the doctors collection by _id Start
    app.put("/api/doctors/:id", async (req, res) => {
      try {
        // ১. req.body থেকে _id এবং অন্যান্য সেনসিটিভ ফিল্ড আলাদা করে ফেলুন
        // বাকি সব ডেটা 'allowedData' এর মধ্যে চলে যাবে
        const { _id, createdAt, userId, ...allowedData } = req.body;

        // ২. মঙ্গোডিবিতে আপডেট রান করুন
        const result = await doctorCollection.updateOne(
          { _id: new ObjectId(req.params.id) }, // এই আইডি-র ডাটাটাই আপডেট হবে (ডিলিট হবে না)
          { $set: allowedData }, // শুধু এই ডাটাগুলো পরিবর্তন হবে
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Doctor not found" });
        }

        res.json({ message: "Profile updated successfully", result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Update an existing doctor profile in the doctors collection by _id End
    //***********************************************************************************

    //***********************************************************************************
    // complete doctors profile with user, doctor, reviews, schedules collection  Start
    app.get("/api/complete-doctors", async (req, res) => {
      try {
        const doctorsWithDetails = await doctorCollection
          .aggregate([
            // ১. String userId-কে ObjectId-তে রূপান্তর করা (অবশ্যই প্রয়োজনীয়)
            {
              $addFields: {
                convertedUserId: { $toObjectId: "$userId" },
              },
            },

            // ২. 'users' কালেকশনের সাথে কানেক্ট করা
            {
              $lookup: {
                from: "user",
                localField: "convertedUserId", // রূপান্তরিত ফিল্ডটি এখানে ব্যবহার হবে
                foreignField: "_id",
                as: "userInfo",
              },
            },
            // Array-কে Object-এ রূপান্তর করা
            {
              $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true },
            },

            // ৩. 'reviews' কালেকশনের সাথে কানেক্ট করা
            {
              $lookup: {
                from: "reviews",
                localField: "_id", // ডক্টরের ObjectId
                foreignField: "doctorId", // রিভিউ কালেকশনে ডক্টরের আইডি যেভাবে আছে
                as: "reviewsData",
              },
            },

            // ৪. 'schedules' কালেকশনের সাথে কানেক্ট করা
            {
              $lookup: {
                from: "schedules",
                localField: "_id",
                foreignField: "doctorId",
                as: "scheduleInfo",
              },
            },
            {
              $unwind: {
                path: "$scheduleInfo",
                preserveNullAndEmptyArrays: true,
              },
            },

            // ৫. আপনার কাঙ্ক্ষিত ফরম্যাটে ডাটা সাজানো
            {
              $project: {
                _id: 0, // মেইন _id হাইড করতে চাইলে রাখতে পারেন
                id: "$_id",
                name: { $ifNull: ["$userInfo.name", ""] },
                image: { $ifNull: ["$userInfo.image", ""] },
                phone: { $ifNull: ["$userInfo.phone", ""] },
                specialization: 1,
                specializations: 1,
                awards: 1,
                qualifications: 1,
                experience: 1,
                consultationFee: 1,
                hospitalName: 1,
                bio: 1,
                verificationStatus: 1,
                userId: 1,
                // রিভিউ ডাটা প্রসেসিং (যদি রিভিউ না থাকে তবে ডিফল্ট ভ্যালু বসবে)
                rating: {
                  $cond: {
                    if: { $gt: [{ $size: "$reviewsData" }, 0] },
                    then: { $round: [{ $avg: "$reviewsData.rating" }, 1] }, // ডেসিমাল ১ ঘর পর্যন্ত রাউন্ড করবে
                    else: 0,
                  },
                },
                reviewCount: { $size: "$reviewsData" },
                reviews: "$reviewsData",
                // সিডিউল ডাটা প্রসেসিং
                availableToday: {
                  $ifNull: ["$scheduleInfo.availableToday", false],
                },
                slots: {
                  $ifNull: [
                    "$scheduleInfo.slots",
                    { morning: [], afternoon: [] },
                  ],
                },
              },
            },
          ])
          .toArray();

        res.json(doctorsWithDetails);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // complete doctors profile with user, doctor, review, schedules collection End
    //***********************************************************************************

    //***********************************************************************************
    // নির্দিষ্ট ডাক্তারের ID দিয়ে ডাটা খোঁজার API Start
    app.get("/api/complete-doctors/:id", async (req, res) => {
      try {
        const doctorId = req.params.id;

        // আইডি ভ্যালিড কিনা চেক করা
        if (!ObjectId.isValid(doctorId)) {
          return res.status(400).json({ error: "Invalid Doctor ID format" });
        }

        const doctorDetails = await doctorCollection
          .aggregate([
            // ১. শুরুতে নির্দিষ্ট ডক্টরের _id দিয়ে ফিল্টার বা ম্যাচ করা
            {
              $match: { _id: new ObjectId(doctorId) },
            },

            // ২. String userId-কে ObjectId-তে রূপান্তর করা
            {
              $addFields: {
                convertedUserId: { $toObjectId: "$userId" },
              },
            },

            // ৩. 'users' কালেকশনের সাথে কানেক্ট করা
            {
              $lookup: {
                from: "user",
                localField: "convertedUserId",
                foreignField: "_id",
                as: "userInfo",
              },
            },
            {
              $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true },
            },

            // ৪. 'reviews' কালেকশনের সাথে কানেক্ট করা
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "doctorId",
                as: "reviewsData",
              },
            },

            // ৫. 'schedules' কালেকশনের সাথে কানেক্ট করা
            {
              $lookup: {
                from: "schedules",
                localField: "_id",
                foreignField: "doctorId",
                as: "scheduleInfo",
              },
            },
            {
              $unwind: {
                path: "$scheduleInfo",
                preserveNullAndEmptyArrays: true,
              },
            },

            // ৬. ফরম্যাট অনুযায়ী ডাটা সাজানো
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: { $ifNull: ["$userInfo.name", ""] },
                image: { $ifNull: ["$userInfo.image", ""] },
                phone: { $ifNull: ["$userInfo.phone", ""] },
                specialization: 1,
                specializations: 1,
                awards: 1,
                qualifications: 1,
                experience: 1,
                consultationFee: 1,
                hospitalName: 1,
                bio: 1,
                verificationStatus: 1,
                userId: 1,
                rating: {
                  $cond: {
                    if: { $gt: [{ $size: "$reviewsData" }, 0] },
                    then: { $round: [{ $avg: "$reviewsData.rating" }, 1] },
                    else: 0,
                  },
                },
                reviewCount: { $size: "$reviewsData" },
                reviews: "$reviewsData",
                availableToday: {
                  $ifNull: ["$scheduleInfo.availableToday", false],
                },
                slots: {
                  $ifNull: [
                    "$scheduleInfo.slots",
                    { morning: [], afternoon: [] },
                  ],
                },
              },
            },
          ])
          .toArray();

        // যদি এই আইডি দিয়ে কোনো ডাক্তার না পাওয়া যায়
        if (doctorDetails.length === 0) {
          return res.status(404).json({ error: "Doctor not found" });
        }

        // যেহেতু একটি মাত্র ডাটা আসবে, তাই অ্যারের ১ম অবজেক্টটি [0] রেসপন্স পাঠানো হচ্ছে
        res.json(doctorDetails[0]);
      } catch (error) {
        console.error("Error fetching single doctor profile:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // নির্দিষ্ট ডাক্তারের ID দিয়ে ডাটা খোঁজার API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    //***********************************************************************************
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

run();

app.listen(port, () => {
  console.log(`🚀 WeCare server running on http://localhost:${port}`);
});
