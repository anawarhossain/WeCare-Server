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
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB successfully!");
    const database = client.db("WeCareDB");

    // const doctorCollection = client.db("WeCareDB").collection("doctors");
    const doctorCollection = database.collection("doctors");
    const usersCollection = database.collection("user");
    const reviewsCollection = database.collection("reviews");
    const schedulesCollection = database.collection("schedules");
    const paymentsCollection = database.collection("payments");
    const prescriptionsCollection = database.collection("prescriptions");
    const contactsCollection = database.collection("contacts");
    const favoriteDoctoreCollection = database.collection("favoriteDoctors");

    // Root
    app.get("/", (req, res) => {
      res.json({ message: "WeCare API is running 🚀" });
    });

    //***********************************************************************************
    //***********************************************************************************
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Create Contacts api Start
    app.post("/api/contacts", async (req, res) => {
      const contact = req.body;
      const result = await contactsCollection.insertOne(contact);
      res.json(result);
    });
    // Contacts api End
    //***********************************************************************************
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Patient Favorite Doctors api Start
    // ১. ইউজার এই ডাক্তারকে ফেভারিট করেছে কিনা তা চেক করার API
    app.get("/api/favorites/check", async (req, res) => {
      try {
        const { userId, doctorId } = req.query;
        if (!userId || !doctorId) {
          return res.status(400).json({ error: "Missing userId or doctorId" });
        }

        const favorite = await favoriteDoctoreCollection.findOne({
          userId,
          doctorId,
        });
        res.json({ isFavorite: !!favorite }); // থাকলে true, না থাকলে false রিটার্ন করবে
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    

    // ২. ফেভারিট টগল (Add/Remove) করার API
    app.post("/api/favorites/toggle", async (req, res) => {
      try {
        const { userId, doctorId, doctorData } = req.body;
        if (!userId || !doctorId) {
          return res.status(400).json({ error: "Missing userId or doctorId" });
        }

        // অলরেডি ফেভারিট লিস্টে আছে কিনা চেক করুন
        const existing = await favoriteDoctoreCollection.findOne({
          userId,
          doctorId,
        });

        if (existing) {
          // থাকলে রিমুভ করে দিন
          await favoriteDoctoreCollection.deleteOne({ userId, doctorId });
          return res.json({
            isFavorite: false,
            message: "Removed from favorites",
          });
        } else {
          // না থাকলে নতুন করে সেভ করুন
          await favoriteDoctoreCollection.insertOne({
            userId,
            doctorId,
            doctorName: doctorData?.name,
            doctorImage: doctorData?.image,
            specialization: doctorData?.specialization,
            createdAt: new Date(),
          });
          return res.json({ isFavorite: true, message: "Added to favorites" });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });


    // ৩ ফেভারিট লিস্ট গেট করার API
    app.get("/api/favorites", async (req, res) => {
      try {
        const { userId } = req.query;
        if (!userId) {
          return res.status(400).json({ error: "Missing userId" });
        }
        const favorites = await favoriteDoctoreCollection
          .find({ userId })
          .toArray();
        res.json(favorites);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    })
    // Patient Favorite Doctors api End
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

            // ২. ডাটা টাইপ কনভার্সন (userId কে ObjectId এবং ডক্টরের নিজস্ব _id কে String করা)
            {
              $addFields: {
                convertedUserId: { $toObjectId: "$userId" },
                doctorIdString: { $toString: "$_id" }, // 👈 এখানে ডক্টরের ObjectId কে String বানিয়ে নেওয়া হলো
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
                localField: "doctorIdString", // 👈 আমাদের তৈরি করা ডক্টরের String ID ফিল্ড
                foreignField: "doctorId", // 👈 schedules কালেকশনে থাকা String doctorId
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
                    {
                      Monday: [],
                      Tuesday: [],
                      Wednesday: [],
                      Thursday: [],
                      Friday: [],
                      Saturday: [],
                      Sunday: [],
                    },
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
    // নির্দিষ্ট ডক্টরের সিডিউল এবং পরিসংখ্যান (Stats) নিয়ে আসার API Start
    app.get("/api/schedules/:doctorId", async (req, res) => {
      try {
        const { doctorId } = req.params;

        // ডাটাবেজ থেকে ডক্টরের সিডিউল খোঁজা
        const schedule = await schedulesCollection.findOne({
          doctorId: doctorId,
        });

        // ডিফল্ট স্ট্রাকচার (যদি ডাটাবেজে আগে থেকে কোনো সিডিউল না থাকে)
        const defaultSlots = {
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
          Sunday: [],
        };

        const slots = schedule ? schedule.slots : defaultSlots;

        // ডাইনামিক পরিসংখ্যান (Stats) গণনা করা
        let weeklySlotsCount = 0;
        Object.values(slots).forEach((daySlots) => {
          if (Array.isArray(daySlots)) weeklySlotsCount += daySlots.length;
        });

        const stats = [
          {
            label: "Weekly Slots",
            value: String(weeklySlotsCount),
            iconBg: "var(--color-success-bg)",
            iconColor: "var(--color-success)",
          },
          {
            label: "Avg. Duration",
            value: schedule?.avgDuration
              ? `${schedule.avgDuration} min`
              : "30 min",
            iconBg: "var(--primary-100)",
            iconColor: "var(--color-primary)",
          },
          {
            label: "Booked Today",
            value: "0 / 0", // এটি অ্যাপয়েন্টমেন্ট কালেকশন থেকে ডাইনামিক করা যাবে পরে
            iconBg: "var(--accent-100)",
            iconColor: "var(--accent-600)",
          },
          {
            label: "Status",
            value: weeklySlotsCount > 0 ? "Active" : "Inactive",
            iconBg:
              weeklySlotsCount > 0
                ? "var(--color-success-bg)"
                : "var(--neutral-200)",
            iconColor:
              weeklySlotsCount > 0
                ? "var(--color-success)"
                : "var(--text-muted)",
            fill: weeklySlotsCount > 0,
            valueColor:
              weeklySlotsCount > 0
                ? "var(--color-success)"
                : "var(--text-muted)",
          },
        ];

        res.json({ slots, stats });
      } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // নির্দিষ্ট ডক্টরের সিডিউল এবং পরিসংখ্যান (Stats) নিয়ে আসার API End
    //***********************************************************************************

    //***********************************************************************************
    // সিডিউল সেভ বা আপডেট করার API (Upsert) Start
    app.post("/api/schedules/save", async (req, res) => {
      try {
        const { doctorId, slots, avgDuration } = req.body;

        if (!doctorId) {
          return res.status(400).json({ error: "Doctor ID is required" });
        }

        // ডাটাবেজে আপডেট করা (না থাকলে নতুন তৈরি হবে - upsert)
        const result = await schedulesCollection.updateOne(
          { doctorId: doctorId },
          {
            $set: {
              slots: slots,
              avgDuration: avgDuration || 30,
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        );

        res.json({ success: true, message: "Schedule updated successfully!" });
      } catch (error) {
        console.error("Error saving schedule:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // সিডিউল সেভ বা আপডেট করার API (Upsert) End
    //***********************************************************************************

    //***********************************************************************************
    // Payment data save API Start
    app.post("/api/payments/save", async (req, res) => {
      try {
        const paymentData = req.body;

        const isExistingPayment = await paymentsCollection.findOne({
          stripeSessionId: paymentData.stripeSessionId,
        });

        if (isExistingPayment) {
          return res.json({
            success: false,
            message: "Already saved",
          });
        }

        await paymentsCollection.insertOne(paymentData);

        res.json({
          success: true,
          message: "Payment data saved successfully!",
        });
      } catch (error) {
        console.error("Error saving payment data:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Payment data save API End
    //***********************************************************************************

    //***********************************************************************************
    // Create Prescription API Start
    app.post("/api/prescriptions/save", async (req, res) => {
      try {
        const prescriptionData = { ...req.body, createdAt: new Date() };

        await prescriptionsCollection.insertOne(prescriptionData);

        res.json({
          success: true,
          message: "Prescription saved successfully!",
        });
      } catch (error) {
        console.error("Error saving prescription:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    //***********************************************************************************

    //***********************************************************************************
    // get appointments API Start
    app.get("/api/appointments", async (req, res) => {
      try {
        const payments = await paymentsCollection
          .find()
          .sort({ createdAt: -1 }) // নতুনগুলো আগে
          .toArray();
        res.json(payments);
      } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // get appointments API End
    //***********************************************************************************

    //***********************************************************************************
    // Get patients appointments by doctorId API Start
    app.get("/api/appointments/:doctorId", async (req, res) => {
      try {
        const doctorId = req.params.doctorId;

        const payments = await paymentsCollection
          .find({ doctorId: doctorId })
          .toArray();

        res.json(payments);
      } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get patients by doctorId API End
    //***********************************************************************************

    //***********************************************************************************
    // treadmendStatus update by id API Start
    app.put("/api/appointments/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { treadmendStatus } = req.body;

        const result = await paymentsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { treadmendStatus: treadmendStatus } },
        );

        res.json({
          success: true,
          message: "Treatment status updated successfully!",
        });
      } catch (error) {
        console.error("Error updating treatment status:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // treadmendStatus update by id API End
    //***********************************************************************************

    //***********************************************************************************
    // Get all prescriptions by doctorId API Start
    app.get("/api/prescriptions/:doctorId", async (req, res) => {
      try {
        const doctorId = req.params.doctorId;

        const prescriptions = await prescriptionsCollection
          .find({ doctorId: doctorId })
          .sort({ createdAt: -1 }) // নতুনগুলো আগে দেখাবে
          .toArray();

        res.json(prescriptions);
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all prescriptions by doctorId API End
    //***********************************************************************************

    //***********************************************************************************
    // Edit/Update prescription by id API Start
    app.put("/api/prescriptions/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { medicines, instructions } = req.body;

        const result = await prescriptionsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              medicines: medicines,
              instructions: instructions,
              updatedAt: new Date(),
            },
          },
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Prescription not found" });
        }

        res.json({
          success: true,
          message: "Prescription updated successfully!",
        });
      } catch (error) {
        console.error("Error updating prescription:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Edit/Update prescription by id API End
    //***********************************************************************************

    //***********************************************************************************
    // Get reviews by userId API Start
    app.get("/api/reviews/user/:userId", async (req, res) => {
      try {
        const userId = req.params.userId;

        const reviews = await reviewsCollection
          .find({ patientId: userId })
          .sort({ createdAt: -1 }) // নতুন রিভিউ আগে দেখাবে
          .toArray();

        res.json(reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get reviews by userId API End
    //***********************************************************************************

    //***********************************************************************************
    // Get all reviews by doctorId API Start
    app.get("/api/reviews/:doctorId", async (req, res) => {
      try {
        const doctorId = req.params.doctorId;

        const reviews = await reviewsCollection
          .find({ doctorId: doctorId })
          .sort({ createdAt: -1 }) // নতুন রিভিউ আগে দেখাবে
          .toArray();

        res.json(reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all reviews by doctorId API End
    //***********************************************************************************

    //***********************************************************************************
    // Create a new review API Start
    app.post("/api/reviews", async (req, res) => {
      try {
        const { doctorId, patientId, rating, reviewText } = req.body;

        if (!doctorId || !patientId || !rating) {
          return res
            .status(400)
            .json({ error: "doctorId, patientId and rating are required" });
        }

        const reviewData = {
          ...req.body,
          rating: Number(rating), // নিশ্চিত করা যে rating সংখ্যা হিসেবেই সেভ হচ্ছে, string না
          createdAt: new Date(),
        };

        const result = await reviewsCollection.insertOne(reviewData);

        res.json({
          success: true,
          message: "Review submitted successfully!",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Create a new review API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    //***********************************************************************************
    //***********************************************************************************
    // paymentsCollection = appointment/booking ডেটা
    // reviewsCollection  = review ডেটা

    // "09:00 PM - 09:30 PM" থেকে শুরুর সময়টাকে মিনিটে বদলানোর হেল্পার
    // (string হিসেবে time sort করলে AM/PM সঠিকভাবে sort হয় না, তাই এটা লাগবে)
    function startTimeToMinutes(timeRange) {
      if (!timeRange) return 0;
      const start = timeRange.split("-")[0].trim(); // "09:00 PM"
      const match = start.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;

      let [, hour, minute, meridiem] = match;
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);

      if (meridiem.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    }

    // appointmentDate ফিল্ডে যে ফরম্যাটে স্ট্রিং সেভ আছে ("Jun 29, 2026"),
    // ঠিক সেই একই ফরম্যাটে আজকের/গত ৭ দিনের তারিখ বানানোর হেল্পার —
    // যাতে string ম্যাচ করানো যায়।
    function formatLikeStored(date) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    //***********************************************************************************
    // Doctor dashboard overview API Start
    app.get("/api/dashboard/overview/:doctorId", async (req, res) => {
      try {
        const doctorId = req.params.doctorId;
        const today = new Date();
        const todayStr = formatLikeStored(today);

        // ── Total Patients (distinct patientId) ──────────────────────
        const distinctPatientIds = await paymentsCollection
          .aggregate([
            {
              $match: { doctorId },
            },
            {
              $group: {
                _id: "$patientId",
              },
            },
          ])
          .toArray();

        const totalPatients = distinctPatientIds.length;

        // ── Today's Appointments ──────────────────────────────────────
        const todaysAppointments = await paymentsCollection
          .find({ doctorId, appointmentDate: todayStr })
          .toArray();

        // string time হিসেবে সেভ থাকায় lexical sort ভুল হবে, তাই minutes দিয়ে sort
        todaysAppointments.sort(
          (a, b) => startTimeToMinutes(a.time) - startTimeToMinutes(b.time),
        );

        const todaysCompletedCount = todaysAppointments.filter(
          (a) => a.treadmendStatus === "completed",
        ).length;

        // ── Reviews (average rating + count) ───────────────────────────
        const reviews = await reviewsCollection.find({ doctorId }).toArray();
        const totalReviews = reviews.length;
        const avgRating = totalReviews
          ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
            totalReviews
          : 0;

        // ── Weekly Appointment Volume (গত ৭ দিন, চার্টের জন্য) ─────────
        // appointmentDate স্ট্রিং হওয়ায় সরাসরি date-range query করা যায় না,
        // তাই গত ৭ দিনের প্রতিটা দিনের জন্য আলাদা করে গণনা করা হলো।
        const weeklyVolume = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const label = d.toLocaleDateString("en-US", { weekday: "short" }); // "Mon", "Tue"...
          const dateStr = formatLikeStored(d);

          const count = await paymentsCollection.countDocuments({
            doctorId,
            appointmentDate: dateStr,
          });

          weeklyVolume.push({ day: label, date: dateStr, count });
        }

        res.json({
          totalPatients,
          todaysAppointmentsCount: todaysAppointments.length,
          todaysCompletedCount,
          todaysSchedule: todaysAppointments,
          avgRating,
          totalReviews,
          weeklyVolume,
        });
      } catch (error) {
        console.error("Error fetching dashboard overview:", error);
        res.status(500).json({ error: error.message });
      }
    });
    // Doctor dashboard overview API End
    //***********************************************************************************

    //***********************************************************************************
    // Edit review by id API Start
    app.put("/api/reviews/:id", async (req, res) => {
      try {
        const reviewId = req.params.id;
        const review = req.body;

        // ID ফরম্যাট ঠিক আছে কিনা চেক
        if (!ObjectId.isValid(reviewId)) {
          return res.status(400).json({ error: "Invalid Review ID format" });
        }

        // মঙ্গোডিবি আইডি আপডেট করার সময় ভুলেও যেন মূল _id পরিবর্তন না হয়, তাই এটি রিমুভ করে নেওয়া নিরাপদ
        const { _id, ...updateData } = review;

        const result = await reviewsCollection.updateOne(
          { _id: new ObjectId(reviewId) },
          { $set: updateData },
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Review not found" });
        }

        res.json({ message: "Review updated successfully" });
      } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ error: error.message });
      }
    });
    // Edit review by id API End
    //***********************************************************************************

    //***********************************************************************************
    // Delete review by id API Start
    app.delete("/api/reviews/:id", async (req, res) => {
      try {
        const reviewId = req.params.id;

        // ID ফরম্যাট ঠিক আছে কিনা চেক
        if (!ObjectId.isValid(reviewId)) {
          return res.status(400).json({ error: "Invalid Review ID format" });
        }

        const result = await reviewsCollection.deleteOne({
          _id: new ObjectId(reviewId),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Review not found" });
        }

        res.json({ message: "Review deleted successfully" });
      } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ error: error.message });
      }
    });
    // Delete review by id API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************

    // doctorCollection-এ name/image নেই — ওটা usersCollection-এ আছে, এবং
    // doctorCollection.userId দিয়ে usersCollection-এর সাথে লিংক করা।
    // তাই join করতে হবে দুই ধাপে:
    //   appointment.doctorId -> doctorCollection._id   (specialization, userId পাওয়া যায়)
    //   doctor.userId        -> usersCollection._id      (name, image পাওয়া যায়)

    // "09:00 PM - 09:30 PM" থেকে শুরুর সময়কে মিনিটে বদলানো
    function startTimeToMinutes(timeRange) {
      if (!timeRange) return 0;
      const start = timeRange.split("-")[0].trim();
      const match = start.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;

      let [, hour, minute, meridiem] = match;
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);

      if (meridiem.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    }

    // "09:00 PM - 09:30 PM" থেকে স্লট কত মিনিটের, সেটা বের করা (গড় consultation সময় ধরার জন্য)
    function slotDurationMinutes(timeRange) {
      if (!timeRange || !timeRange.includes("-")) return 30; // fallback
      const [start, end] = timeRange.split("-").map((s) => s.trim());
      const startMin = startTimeToMinutes(`${start}-${start}`); // reuse parser
      const endMin = startTimeToMinutes(`${end}-${end}`);
      const diff = endMin - startMin;
      return diff > 0 ? diff : 30;
    }

    function formatLikeStored(date) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    //***********************************************************************************
    // Get all appointments for a patient (with doctor info + live queue/wait time) — API Start
    app.get("/api/appointments/patient/:patientId", async (req, res) => {
      try {
        const patientId = req.params.patientId;

        const appointments = await paymentsCollection
          .find({ patientId })
          .toArray();

        if (appointments.length === 0) {
          return res.json([]);
        }

        // ── doctor info enrichment ──────────────────────────────────────
        // ধাপ ১: appointment.doctorId দিয়ে doctorCollection থেকে profile আনা
        // (specialization এখানেই আছে, কিন্তু name/image নেই)
        const doctorIds = [...new Set(appointments.map((a) => a.doctorId))];
        const validDoctorObjectIds = doctorIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const doctorProfiles = await doctorCollection
          .find({ _id: { $in: validDoctorObjectIds } })
          .toArray();

        // ধাপ ২: doctorProfile.userId দিয়ে usersCollection থেকে name/image আনা
        const userIds = [
          ...new Set(doctorProfiles.map((d) => d.userId).filter(Boolean)),
        ];
        const validUserObjectIds = userIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const users = await usersCollection
          .find({ _id: { $in: validUserObjectIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        // doctorId (appointment-এ যেটা সেভ আছে) → { name, image, specialization } ম্যাপ
        const doctorMap = new Map(
          doctorProfiles.map((d) => {
            const user = userMap.get(String(d.userId));
            return [
              d._id.toString(),
              {
                name: user?.name || "Doctor",
                image: user?.image || null,
                specialization: d.specialization || "",
              },
            ];
          }),
        );

        const todayStr = formatLikeStored(new Date());

        // ── প্রতিটা appointment-এর জন্য queue position + estimated wait ────
        const enriched = await Promise.all(
          appointments.map(async (appt) => {
            const doctor = doctorMap.get(appt.doctorId);

            const isActiveToday =
              appt.appointmentDate === todayStr &&
              (appt.treadmendStatus === "pending" ||
                appt.treadmendStatus === "accepted");

            let queueAheadCount = null;
            let estimatedWaitMinutes = null;

            if (isActiveToday) {
              // একই ডাক্তারের আজকের অন্য সব active appointment আনা হলো
              const sameDayDocAppointments = await paymentsCollection
                .find({
                  doctorId: appt.doctorId,
                  appointmentDate: todayStr,
                  treadmendStatus: { $in: ["pending", "accepted"] },
                })
                .toArray();

              const myStart = startTimeToMinutes(appt.time);

              // আমার আগে স্লট যাদের, এবং এখনো completed হয়নি — তারাই queue-তে "আগে"
              const ahead = sameDayDocAppointments.filter(
                (a) =>
                  a._id.toString() !== appt._id.toString() &&
                  startTimeToMinutes(a.time) < myStart,
              );

              const avgDuration = slotDurationMinutes(appt.time);
              queueAheadCount = ahead.length;
              estimatedWaitMinutes = ahead.length * avgDuration;
            }

            return {
              ...appt,
              doctorName: doctor?.name || "Doctor",
              doctorImage: doctor?.image || null,
              specialization: doctor?.specialization || "",
              queueAheadCount,
              estimatedWaitMinutes,
            };
          }),
        );

        // নতুন তারিখ আগে দেখানো (appointmentDate string হওয়ায় Date-এ কনভার্ট করে sort)
        enriched.sort(
          (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
        );

        res.json(enriched);
      } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all appointments for a patient API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************

    // doctor info enrichment আগের patient-appointments route-এর মতই দুই ধাপের join:
    //   payment.doctorId -> doctorsCollection._id (specialization, userId)
    //   doctor.userId     -> usersCollection._id   (name, image)

    //***********************************************************************************
    // Get patient's payment history (with doctor info + summary totals) — API Start
    app.get("/api/payments/patient/:patientId", async (req, res) => {
      try {
        const patientId = req.params.patientId;

        const payments = await paymentsCollection
          .find({ patientId })
          .sort({ createdAt: -1 })
          .toArray();

        if (payments.length === 0) {
          return res.json({
            summary: { totalPaid: 0, totalTransactions: 0 },
            transactions: [],
          });
        }

        // ── doctor info enrichment ──────────────────────────────────────
        const doctorIds = [...new Set(payments.map((p) => p.doctorId))];
        const validDoctorObjectIds = doctorIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const doctorProfiles = await doctorCollection
          .find({ _id: { $in: validDoctorObjectIds } })
          .toArray();

        const userIds = [
          ...new Set(doctorProfiles.map((d) => d.userId).filter(Boolean)),
        ];
        const validUserObjectIds = userIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const users = await usersCollection
          .find({ _id: { $in: validUserObjectIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const doctorMap = new Map(
          doctorProfiles.map((d) => {
            const user = userMap.get(String(d.userId));
            return [
              d._id.toString(),
              {
                name: user?.name || "Doctor",
                image: user?.image || null,
                specialization: d.specialization || "",
              },
            ];
          }),
        );

        // ── প্রতিটা payment-কে একটা readable transaction হিসেবে সাজানো ─────
        const transactions = payments.map((p) => {
          const doctor = doctorMap.get(p.doctorId);
          return {
            _id: p._id,
            // _id-এর শেষ ৬ ক্যারেক্টার দিয়ে একটা readable transaction ID বানানো হলো,
            // কারণ collection-এ আলাদা কোনো invoice/transaction number ফিল্ড নেই
            transactionId: `TXN-${p._id.toString().slice(-6).toUpperCase()}`,
            doctorName: doctor?.name || "Doctor",
            doctorImage: doctor?.image || null,
            specialization: doctor?.specialization || "",
            appointmentDate: p.appointmentDate,
            time: p.time,
            fee: Number(p.fee || 0),
            paymentStatus: p.paymentStatus || "pending",
            customerName: p.patientName || "",
            stripeSessionId: p.stripeSessionId || "",
          };
        });

        // নতুন তারিখ আগে
        transactions.sort(
          (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
        );

        const totalPaid = transactions
          .filter((t) => t.paymentStatus === "paid")
          .reduce((sum, t) => sum + t.fee, 0);

        res.json({
          summary: {
            totalPaid,
            totalTransactions: transactions.length,
          },
          transactions,
        });
      } catch (error) {
        console.error("Error fetching payment history:", error);
        res.status(500).json({ error: error.message });
      }
    });
    // Get patient's payment history API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Admin doctors management
    // doctorsCollection-এ name/image নেই, usersCollection থেকে join করে আনা হচ্ছে
    // (আগের patient-appointments/payments route-এর মতই pattern)

    //***********************************************************************************
    // Get all doctors for admin (with user info + status counts) — API Start
    app.get("/api/admin/doctors", async (req, res) => {
      try {
        const doctorProfiles = await doctorCollection.find({}).toArray();

        if (doctorProfiles.length === 0) {
          return res.json({
            doctors: [],
            counts: { all: 0, pending: 0, verified: 0, rejected: 0 },
          });
        }

        const userIds = [
          ...new Set(doctorProfiles.map((d) => d.userId).filter(Boolean)),
        ];
        const validUserObjectIds = userIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const users = await usersCollection
          .find({ _id: { $in: validUserObjectIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const doctors = doctorProfiles.map((d) => {
          const user = userMap.get(String(d.userId));
          return {
            _id: d._id,
            name: user?.name || "Unknown Doctor",
            image: user?.image || null,
            email: user?.email || "",
            phone: user?.phone || "",
            gender: user?.gender || "",
            specialization: d.specialization || "",
            specializations: d.specializations || [],
            awards: d.awards || [],
            qualifications: d.qualifications || "",
            experience: d.experience || 0,
            consultationFee: d.consultationFee || "",
            hospitalName: d.hospitalName || "",
            bio: d.bio || "",
            // verificationStatus-এর সম্ভাব্য মান: "Pending" | "Verified" | "Rejected"
            verificationStatus: d.verificationStatus || "Pending",
            createdAt: d.createdAt,
          };
        });

        // নতুন আবেদনকারী আগে দেখানো
        doctors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const counts = {
          all: doctors.length,
          pending: 0,
          verified: 0,
          rejected: 0,
        };
        doctors.forEach((d) => {
          const key = d.verificationStatus.toLowerCase();
          if (counts[key] !== undefined) counts[key] += 1;
        });

        res.json({ doctors, counts });
      } catch (error) {
        console.error("Error fetching admin doctors:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all doctors for admin API End
    //***********************************************************************************

    //***********************************************************************************
    // Update a doctor's verification status — API Start
    app.put("/api/admin/doctors/:id/status", async (req, res) => {
      try {
        const id = req.params.id;
        const { verificationStatus } = req.body;

        const allowedStatuses = ["Pending", "Verified", "Rejected"];
        if (!allowedStatuses.includes(verificationStatus)) {
          return res
            .status(400)
            .json({ error: "Invalid verificationStatus value" });
        }

        const result = await doctorCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { verificationStatus, updatedAt: new Date() } },
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Doctor not found" });
        }

        res.json({
          success: true,
          message: `Doctor marked as ${verificationStatus}.`,
        });
      } catch (error) {
        console.error("Error updating doctor verification status:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Update a doctor's verification status API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Admin patients management
    // usersCollection-এ doctor/patient/admin সব role একসাথে আছে, তাই role:"patient"
    // দিয়ে ফিল্টার করে আনতে হবে। সাথে paymentsCollection থেকে প্রতিটা patient-এর
    // total appointments + total spent aggregate করে যুক্ত করা হলো।

    //***********************************************************************************
    // Get all patients for admin (with appointment stats) — API Start
    app.get("/api/admin/patients", async (req, res) => {
      try {
        const patients = await usersCollection
          .find({ role: "patient" })
          .toArray();

        if (patients.length === 0) {
          return res.json({
            patients: [],
            counts: { all: 0, active: 0, suspended: 0 },
          });
        }

        // ── প্রতিটা patientId-এর জন্য total appointments + total spent ──────
        const stats = await paymentsCollection
          .aggregate([
            {
              $group: {
                _id: "$patientId",
                totalAppointments: { $sum: 1 },
                totalSpent: {
                  $sum: {
                    $cond: [
                      { $eq: ["$paymentStatus", "paid"] },
                      { $toDouble: "$fee" },
                      0,
                    ],
                  },
                },
              },
            },
          ])
          .toArray();

        const statsMap = new Map(stats.map((s) => [s._id, s]));

        const enrichedPatients = patients.map((p) => {
          const stat = statsMap.get(p._id.toString());
          return {
            _id: p._id,
            name: p.name || "Unknown",
            email: p.email || "",
            phone: p.phone || "",
            gender: p.gender || "",
            image: p.image || null,
            // status ফিল্ডে কিছু না থাকলে ধরে নেওয়া হলো account active
            status: p.status || "active",
            createdAt: p.createdAt,
            totalAppointments: stat?.totalAppointments || 0,
            totalSpent: stat?.totalSpent || 0,
          };
        });

        // নতুন রেজিস্ট্রেশন আগে
        enrichedPatients.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        const counts = {
          all: enrichedPatients.length,
          active: 0,
          suspended: 0,
        };
        enrichedPatients.forEach((p) => {
          const key = p.status.toLowerCase();
          if (counts[key] !== undefined) counts[key] += 1;
        });

        res.json({ patients: enrichedPatients, counts });
      } catch (error) {
        console.error("Error fetching admin patients:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get all patients for admin API End
    //***********************************************************************************

    //***********************************************************************************
    // Update a patient's account status (active/suspended) — API Start
    app.put("/api/admin/patients/:id/status", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;

        const allowedStatuses = ["active", "suspended"];
        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({ error: "Invalid status value" });
        }

        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id), role: "patient" }, // role চেক করা হলো যাতে ভুলে doctor/admin আপডেট না হয়
          { $set: { status, updatedAt: new Date() } },
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Patient not found" });
        }

        res.json({
          success: true,
          message: `Patient account marked as ${status}.`,
        });
      } catch (error) {
        console.error("Error updating patient status:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Update a patient's account status API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Admin Appointments Overview API Start
    // নোট: ক্যান্সেল করার জন্য আলাদা route লাগবে না — আগের তৈরি করা
    // PUT /api/appointments/:id (treadmendStatus আপডেট করে) এটাই reuse করা হচ্ছে।
    // patientName/patientImage paymentsCollection-এই denormalized আছে, তাই শুধু
    // doctor info-র জন্য join লাগবে (doctorsCollection -> usersCollection, আগের pattern)

    //***********************************************************************************
    // Admin: all appointments overview (with doctor info + stats) — API Start
    app.get("/api/admin/appointments/overview", async (req, res) => {
      try {
        const appointments = await paymentsCollection.find({}).toArray();

        if (appointments.length === 0) {
          return res.json({
            stats: {
              total: 0,
              upcoming: 0,
              completed: 0,
              cancelled: 0,
              totalRevenue: 0,
            },
            appointments: [],
          });
        }

        // ── doctor info enrichment ──────────────────────────────────────
        const doctorIds = [...new Set(appointments.map((a) => a.doctorId))];
        const validDoctorObjectIds = doctorIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const doctorProfiles = await doctorCollection
          .find({ _id: { $in: validDoctorObjectIds } })
          .toArray();

        const userIds = [
          ...new Set(doctorProfiles.map((d) => d.userId).filter(Boolean)),
        ];
        const validUserObjectIds = userIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const users = await usersCollection
          .find({ _id: { $in: validUserObjectIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const doctorMap = new Map(
          doctorProfiles.map((d) => {
            const user = userMap.get(String(d.userId));
            return [
              d._id.toString(),
              {
                name: user?.name || "Doctor",
                image: user?.image || null,
                specialization: d.specialization || "",
              },
            ];
          }),
        );

        const enriched = appointments.map((a) => {
          const doctor = doctorMap.get(a.doctorId);
          return {
            _id: a._id,
            patientId: a.patientId,
            patientName: a.patientName,
            patientImage: a.patientImage,
            doctorName: doctor?.name || "Doctor",
            doctorImage: doctor?.image || null,
            specialization: doctor?.specialization || "",
            appointmentDate: a.appointmentDate,
            time: a.time,
            fee: Number(a.fee || 0),
            notes: a.notes || "",
            paymentStatus: a.paymentStatus || "pending",
            customerCardName: a.customerCardName || "",
            treadmendStatus: a.treadmendStatus || "pending",
          };
        });

        // নতুন তারিখ আগে
        enriched.sort(
          (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
        );

        // ── overview stats ───────────────────────────────────────────
        const stats = enriched.reduce(
          (acc, a) => {
            acc.total += 1;
            if (
              a.treadmendStatus === "pending" ||
              a.treadmendStatus === "accepted"
            )
              acc.upcoming += 1;
            else if (a.treadmendStatus === "completed") acc.completed += 1;
            else if (a.treadmendStatus === "rejected") acc.cancelled += 1;
            if (a.paymentStatus === "paid") acc.totalRevenue += a.fee;
            return acc;
          },
          {
            total: 0,
            upcoming: 0,
            completed: 0,
            cancelled: 0,
            totalRevenue: 0,
          },
        );

        res.json({ stats, appointments: enriched });
      } catch (error) {
        console.error("Error fetching admin appointments overview:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Admin: all appointments overview API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Admin dashboard Overview API Start

    function monthKey(date) {
      return `${date.getFullYear()}-${date.getMonth()}`;
    }

    function percentChange(current, previous) {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    function timeAgo(date) {
      const diffMs = Date.now() - new Date(date).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
      const days = Math.floor(hours / 24);
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    //***********************************************************************************
    // Admin: dashboard overview (stats + charts + activity feed) — API Start
    app.get("/api/admin/dashboard/overview", async (req, res) => {
      try {
        const now = new Date();
        const thisMonthKey = monthKey(now);
        const lastMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const lastMonthKey = monthKey(lastMonthDate);

        // ── সব raw data একবারে আনা হলো ────────────────────────────────
        const [allUsers, allDoctors, allPayments, allReviews] =
          await Promise.all([
            usersCollection.find({}).toArray(),
            doctorCollection.find({}).toArray(),
            paymentsCollection.find({}).toArray(),
            reviewsCollection.find({}).toArray(),
          ]);

        // ── Total Users + month-over-month trend (real createdAt ব্যবহার করে) ──
        const usersThisMonth = allUsers.filter(
          (u) =>
            u.createdAt && monthKey(new Date(u.createdAt)) === thisMonthKey,
        ).length;
        const usersLastMonth = allUsers.filter(
          (u) =>
            u.createdAt && monthKey(new Date(u.createdAt)) === lastMonthKey,
        ).length;

        // ── Total Doctors + trend ──────────────────────────────────────
        const doctorsThisMonth = allDoctors.filter(
          (d) =>
            d.createdAt && monthKey(new Date(d.createdAt)) === thisMonthKey,
        ).length;
        const doctorsLastMonth = allDoctors.filter(
          (d) =>
            d.createdAt && monthKey(new Date(d.createdAt)) === lastMonthKey,
        ).length;

        // ── Total Appointments + trend (appointmentDate string ব্যবহার করে) ──
        const apptsThisMonth = allPayments.filter(
          (p) =>
            p.appointmentDate &&
            monthKey(new Date(p.appointmentDate)) === thisMonthKey,
        ).length;
        const apptsLastMonth = allPayments.filter(
          (p) =>
            p.appointmentDate &&
            monthKey(new Date(p.appointmentDate)) === lastMonthKey,
        ).length;

        // ── Total Revenue + trend (paid appointments-এর fee যোগ করে) ──
        const paidPayments = allPayments.filter(
          (p) => p.paymentStatus === "paid",
        );
        const totalRevenue = paidPayments.reduce(
          (sum, p) => sum + Number(p.fee || 0),
          0,
        );
        const revenueThisMonth = paidPayments
          .filter(
            (p) =>
              p.appointmentDate &&
              monthKey(new Date(p.appointmentDate)) === thisMonthKey,
          )
          .reduce((sum, p) => sum + Number(p.fee || 0), 0);
        const revenueLastMonth = paidPayments
          .filter(
            (p) =>
              p.appointmentDate &&
              monthKey(new Date(p.appointmentDate)) === lastMonthKey,
          )
          .reduce((sum, p) => sum + Number(p.fee || 0), 0);

        const stats = {
          totalUsers: allUsers.length,
          totalUsersTrend: percentChange(usersThisMonth, usersLastMonth),
          totalDoctors: allDoctors.length,
          totalDoctorsTrend: percentChange(doctorsThisMonth, doctorsLastMonth),
          totalAppointments: allPayments.length,
          totalAppointmentsTrend: percentChange(apptsThisMonth, apptsLastMonth),
          totalRevenue,
          totalRevenueTrend: percentChange(revenueThisMonth, revenueLastMonth),
        };

        // ── Monthly appointment volume — গত ৬ মাস ───────────────────────
        const monthlyVolume = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = monthKey(d);
          const count = allPayments.filter(
            (p) =>
              p.appointmentDate &&
              monthKey(new Date(p.appointmentDate)) === key,
          ).length;
          monthlyVolume.push({
            month: d.toLocaleDateString("en-US", { month: "short" }),
            count,
          });
        }

        // ── Doctor specialization breakdown (donut chart) ────────────────
        const specializationCounts = {};
        allDoctors.forEach((d) => {
          const spec = d.specialization || "Other";
          specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
        });
        const specializationBreakdown = Object.entries(specializationCounts)
          .map(([specialization, count]) => ({ specialization, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // টপ ৬টা specialization, বাকিগুলো chart-কে অগোছালো করে ফেলবে

        // ── Doctor performance — average rating by doctor (top 5) ────────
        const userMap = new Map(allUsers.map((u) => [u._id.toString(), u]));
        const reviewsByDoctor = new Map();
        allReviews.forEach((r) => {
          const entry = reviewsByDoctor.get(r.doctorId) || { sum: 0, count: 0 };
          entry.sum += Number(r.rating || 0);
          entry.count += 1;
          reviewsByDoctor.set(r.doctorId, entry);
        });

        const doctorPerformance = allDoctors
          .map((d) => {
            const reviewStats = reviewsByDoctor.get(d._id.toString());
            if (!reviewStats || reviewStats.count === 0) return null;
            const user = userMap.get(String(d.userId));
            return {
              doctorName: user?.name || "Doctor",
              avgRating: reviewStats.sum / reviewStats.count,
              totalReviews: reviewStats.count,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 5);

        // ── Recent Activity Feed — একাধিক collection থেকে merge করা ──────
        // (paymentsCollection-এ কোনো "booked at" timestamp না থাকায়, appointment/payment
        // ইভেন্টে আসল "X min ago" না দেখিয়ে appointmentDate-টাই দেখানো হচ্ছে — সততার খাতিরে)
        const feed = [];

        [...allUsers]
          .filter((u) => u.role === "patient" && u.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .forEach((u) => {
            feed.push({
              type: "patient_registered",
              title: `New Patient Registered: ${u.name}`,
              subtitle: "Patient account created on the platform.",
              sortDate: new Date(u.createdAt),
              displayTime: timeAgo(u.createdAt),
            });
          });

        [...allDoctors]
          .filter((d) => d.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .forEach((d) => {
            const user = userMap.get(String(d.userId));
            feed.push({
              type: "doctor_joined",
              title: `New Doctor Joined: ${user?.name || "Doctor"}`,
              subtitle: `Registered under ${d.specialization || "General"}.`,
              sortDate: new Date(d.createdAt),
              displayTime: timeAgo(d.createdAt),
            });
          });

        [...allPayments]
          .filter((p) => p.treadmendStatus === "completed" && p.appointmentDate)
          .sort(
            (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
          )
          .slice(0, 5)
          .forEach((p) => {
            feed.push({
              type: "appointment_completed",
              title: `Appointment Completed: ${p.patientName}`,
              subtitle: "Consultation marked as completed.",
              sortDate: new Date(p.appointmentDate),
              displayTime: p.appointmentDate, // আসল completion timestamp নেই, তাই তারিখটাই দেখানো হলো
            });
          });

        [...paidPayments]
          .filter((p) => p.appointmentDate)
          .sort(
            (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
          )
          .slice(0, 5)
          .forEach((p) => {
            feed.push({
              type: "payment_received",
              title: `Payment Received: $${Number(p.fee).toFixed(2)} from ${p.patientName}`,
              subtitle: "Payment cleared successfully.",
              sortDate: new Date(p.appointmentDate),
              displayTime: p.appointmentDate,
            });
          });

        feed.sort((a, b) => b.sortDate - a.sortDate);
        const activityFeed = feed.slice(0, 8);

        res.json({
          stats,
          monthlyVolume,
          specializationBreakdown,
          doctorPerformance,
          activityFeed,
        });
      } catch (error) {
        console.error("Error fetching admin dashboard overview:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Admin: dashboard overview API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Patient Dashboard API Start
    // doctor enrichment + queue/wait-time logic আগের patient-appointments route থেকে reuse করা হলো

    function startTimeToMinutes(timeRange) {
      if (!timeRange) return 0;
      const start = timeRange.split("-")[0].trim();
      const match = start.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let [, hour, minute, meridiem] = match;
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);
      if (meridiem.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
      return hour * 60 + minute;
    }

    function slotDurationMinutes(timeRange) {
      if (!timeRange || !timeRange.includes("-")) return 30;
      const [start, end] = timeRange.split("-").map((s) => s.trim());
      const startMin = startTimeToMinutes(`${start}-${start}`);
      const endMin = startTimeToMinutes(`${end}-${end}`);
      const diff = endMin - startMin;
      return diff > 0 ? diff : 30;
    }

    function formatLikeStored(date) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    function monthKey(date) {
      return `${date.getFullYear()}-${date.getMonth()}`;
    }

    //***********************************************************************************
    // Patient dashboard overview — API Start
    app.get("/api/patient-dashboard/overview/:patientId", async (req, res) => {
      try {
        const patientId = req.params.patientId;
        const now = new Date();
        const todayStr = formatLikeStored(now);

        const allAppointments = await paymentsCollection
          .find({ patientId })
          .toArray();

        if (allAppointments.length === 0) {
          return res.json({
            stats: {
              upcomingCount: 0,
              upcomingThisWeek: 0,
              totalVisits: 0,
              lastVisitDate: null,
              totalPaid: 0,
              outstandingAmount: 0,
              doctorsVisited: 0,
            },
            upcomingAppointments: [],
            visitHistory: [],
          });
        }

        // ── doctor info enrichment (দুই ধাপের join, আগের pattern) ────────
        const doctorIds = [...new Set(allAppointments.map((a) => a.doctorId))];
        const validDoctorObjectIds = doctorIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));
        const doctorProfiles = await doctorCollection
          .find({ _id: { $in: validDoctorObjectIds } })
          .toArray();
        const userIds = [
          ...new Set(doctorProfiles.map((d) => d.userId).filter(Boolean)),
        ];
        const validUserObjectIds = userIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));
        const users = await usersCollection
          .find({ _id: { $in: validUserObjectIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));
        const doctorMap = new Map(
          doctorProfiles.map((d) => {
            const user = userMap.get(String(d.userId));
            return [
              d._id.toString(),
              {
                name: user?.name || "Doctor",
                image: user?.image || null,
                specialization: d.specialization || "",
              },
            ];
          }),
        );

        // ── Stats ────────────────────────────────────────────────────────
        const upcoming = allAppointments.filter(
          (a) =>
            (a.treadmendStatus === "pending" ||
              a.treadmendStatus === "accepted") &&
            new Date(a.appointmentDate) >=
              new Date(new Date().setHours(0, 0, 0, 0)),
        );

        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const upcomingThisWeek = upcoming.filter(
          (a) => new Date(a.appointmentDate) <= sevenDaysFromNow,
        ).length;

        const completed = allAppointments.filter(
          (a) => a.treadmendStatus === "completed",
        );
        const lastVisit = completed
          .slice()
          .sort(
            (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
          )[0];

        const paid = allAppointments.filter((a) => a.paymentStatus === "paid");
        const totalPaid = paid.reduce((sum, a) => sum + Number(a.fee || 0), 0);

        const outstanding = allAppointments.filter(
          (a) => a.paymentStatus !== "paid" && a.treadmendStatus !== "rejected",
        );
        const outstandingAmount = outstanding.reduce(
          (sum, a) => sum + Number(a.fee || 0),
          0,
        );

        const doctorsVisited = new Set(completed.map((a) => a.doctorId)).size;

        const stats = {
          upcomingCount: upcoming.length,
          upcomingThisWeek,
          totalVisits: completed.length,
          lastVisitDate: lastVisit?.appointmentDate || null,
          totalPaid,
          outstandingAmount,
          doctorsVisited,
        };

        // ── Upcoming appointments list (doctor info + queue/wait time) ───
        const upcomingAppointments = await Promise.all(
          upcoming
            .sort(
              (a, b) =>
                new Date(a.appointmentDate) - new Date(b.appointmentDate),
            )
            .slice(0, 5) // dashboard-এ শুধু পরের কয়েকটাই দরকার, বাকিটা /patient/appointments পেজে
            .map(async (appt) => {
              const doctor = doctorMap.get(appt.doctorId);
              const isActiveToday = appt.appointmentDate === todayStr;

              let queueAheadCount = null;
              let estimatedWaitMinutes = null;

              if (isActiveToday) {
                const sameDayDocAppointments = await paymentsCollection
                  .find({
                    doctorId: appt.doctorId,
                    appointmentDate: todayStr,
                    treadmendStatus: { $in: ["pending", "accepted"] },
                  })
                  .toArray();
                const myStart = startTimeToMinutes(appt.time);
                const ahead = sameDayDocAppointments.filter(
                  (a) =>
                    a._id.toString() !== appt._id.toString() &&
                    startTimeToMinutes(a.time) < myStart,
                );
                queueAheadCount = ahead.length;
                estimatedWaitMinutes =
                  ahead.length * slotDurationMinutes(appt.time);
              }

              return {
                ...appt,
                doctorName: doctor?.name || "Doctor",
                doctorImage: doctor?.image || null,
                specialization: doctor?.specialization || "",
                queueAheadCount,
                estimatedWaitMinutes,
              };
            }),
        );

        // ── Visit history (last 6 months, completed appointments) ────────
        const visitHistory = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = monthKey(d);
          const count = completed.filter(
            (a) =>
              a.appointmentDate &&
              monthKey(new Date(a.appointmentDate)) === key,
          ).length;
          visitHistory.push({
            month: d.toLocaleDateString("en-US", { month: "short" }),
            count,
          });
        }

        res.json({ stats, upcomingAppointments, visitHistory });
      } catch (error) {
        console.error("Error fetching patient dashboard overview:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Patient dashboard overview API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Admin payments overview API Start
    // doctor info enrichment আগের admin-appointments route-এর মতই দুই ধাপের join

    function monthKey(date) {
      return `${date.getFullYear()}-${date.getMonth()}`;
    }

    function dayKey(date) {
      return date.toISOString().slice(0, 10); // YYYY-MM-DD
    }

    function startOfWeek(date) {
      const d = new Date(date);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    //***********************************************************************************
    // Admin: payments overview (stats + multi-range revenue chart + ledger) — API Start
    app.get("/api/admin/payments/overview", async (req, res) => {
      try {
        const allPayments = await paymentsCollection.find({}).toArray();
        const now = new Date();

        if (allPayments.length === 0) {
          return res.json({
            stats: {
              totalRevenue: 0,
              totalRevenueTrend: 0,
              totalTransactions: 0,
              transactionsLast30Days: 0,
              thisMonthRevenue: 0,
              thisMonthRevenueTrend: 0,
            },
            revenueByDay: [],
            revenueByWeek: [],
            revenueByMonth: [],
            transactions: [],
          });
        }

        // ── doctor info enrichment (দুই ধাপের join, আগের pattern) ────────
        const doctorIds = [...new Set(allPayments.map((p) => p.doctorId))];
        const validDoctorObjectIds = doctorIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));
        const doctorProfiles = await doctorCollection
          .find({ _id: { $in: validDoctorObjectIds } })
          .toArray();
        const userIds = [
          ...new Set(doctorProfiles.map((d) => d.userId).filter(Boolean)),
        ];
        const validUserObjectIds = userIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));
        const users = await usersCollection
          .find({ _id: { $in: validUserObjectIds } })
          .toArray();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));
        const doctorMap = new Map(
          doctorProfiles.map((d) => {
            const user = userMap.get(String(d.userId));
            return [
              d._id.toString(),
              {
                name: user?.name || "Doctor",
                image: user?.image || null,
                specialization: d.specialization || "",
              },
            ];
          }),
        );

        const paidPayments = allPayments.filter(
          (p) => p.paymentStatus === "paid",
        );

        // ── Stats ────────────────────────────────────────────────────────
        const totalRevenue = paidPayments.reduce(
          (sum, p) => sum + Number(p.fee || 0),
          0,
        );

        const thisMonthKey = monthKey(now);
        const lastMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const lastMonthKeyStr = monthKey(lastMonthDate);

        const thisMonthRevenue = paidPayments
          .filter(
            (p) =>
              p.appointmentDate &&
              monthKey(new Date(p.appointmentDate)) === thisMonthKey,
          )
          .reduce((sum, p) => sum + Number(p.fee || 0), 0);
        const lastMonthRevenue = paidPayments
          .filter(
            (p) =>
              p.appointmentDate &&
              monthKey(new Date(p.appointmentDate)) === lastMonthKeyStr,
          )
          .reduce((sum, p) => sum + Number(p.fee || 0), 0);

        const totalRevenueTrend =
          lastMonthRevenue === 0
            ? thisMonthRevenue > 0
              ? 100
              : 0
            : Math.round(
                ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
                  100,
              );

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const transactionsLast30Days = allPayments.filter(
          (p) =>
            p.appointmentDate && new Date(p.appointmentDate) >= thirtyDaysAgo,
        ).length;

        const stats = {
          totalRevenue,
          totalRevenueTrend,
          totalTransactions: allPayments.length,
          transactionsLast30Days,
          thisMonthRevenue,
          thisMonthRevenueTrend: totalRevenueTrend, // একই মাসিক তুলনা থেকে আসছে
        };

        // ── Revenue chart: ৩টা ভিন্ন রেঞ্জ একসাথে প্রিকম্পিউট করা হলো ──────
        // (client-এ "Last 30 Days / Last 3 Months / Last Year" সিলেক্ট করলে আর
        // নতুন request লাগবে না, একবারেই সব ডেটা চলে আসছে)

        // Last 30 days — daily
        const revenueByDay = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = dayKey(d);
          const revenue = paidPayments
            .filter(
              (p) =>
                p.appointmentDate &&
                dayKey(new Date(p.appointmentDate)) === key,
            )
            .reduce((sum, p) => sum + Number(p.fee || 0), 0);
          revenueByDay.push({
            label: d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            revenue,
          });
        }

        // Last 3 months — weekly (~13 সপ্তাহ)
        const revenueByWeek = [];
        for (let i = 12; i >= 0; i--) {
          const weekStart = startOfWeek(
            new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7),
          );
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          const revenue = paidPayments
            .filter((p) => {
              if (!p.appointmentDate) return false;
              const d = new Date(p.appointmentDate);
              return d >= weekStart && d < weekEnd;
            })
            .reduce((sum, p) => sum + Number(p.fee || 0), 0);
          revenueByWeek.push({
            label: weekStart.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            revenue,
          });
        }

        // Last 12 months — monthly
        const revenueByMonth = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = monthKey(d);
          const revenue = paidPayments
            .filter(
              (p) =>
                p.appointmentDate &&
                monthKey(new Date(p.appointmentDate)) === key,
            )
            .reduce((sum, p) => sum + Number(p.fee || 0), 0);
          revenueByMonth.push({
            label: d.toLocaleDateString("en-US", { month: "short" }),
            revenue,
          });
        }

        // ── Transaction Ledger ────────────────────────────────────────────
        const transactions = allPayments.map((p) => {
          const doctor = doctorMap.get(p.doctorId);
          return {
            _id: p._id,
            transactionId: `TXN-${p._id.toString().slice(-6).toUpperCase()}`,
            patientName: p.patientName,
            patientImage: p.patientImage,
            doctorName: doctor?.name || "Doctor",
            doctorImage: doctor?.image || null,
            specialization: doctor?.specialization || "",
            fee: Number(p.fee || 0),
            appointmentDate: p.appointmentDate,
            time: p.time,
            paymentStatus: p.paymentStatus || "pending",
            customerCardName: p.customerCardName || "",
          };
        });

        transactions.sort(
          (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
        );

        res.json({
          stats,
          revenueByDay,
          revenueByWeek,
          revenueByMonth,
          transactions,
        });
      } catch (error) {
        console.error("Error fetching admin payments overview:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Admin: payments overview API End
    //***********************************************************************************

    //***********************************************************************************
    //***********************************************************************************
    // Home page API Start
    // এটা একটা পাবলিক রুট — কোনো auth middleware লাগবে না, যেকেউ কল করতে পারবে

    //***********************************************************************************
    // Public: home page overview (stats + specializations + featured doctors + testimonials)
    app.get("/api/home/overview", async (req, res) => {
      try {
        const [allUsers, verifiedDoctors, allPayments, allReviews] =
          await Promise.all([
            usersCollection.find({}).toArray(),
            // পাবলিক পেজে শুধু verified doctor-ই দেখানো হবে, pending/rejected বাদ
            doctorCollection
              .find({ verificationStatus: "Verified" })
              .toArray(),
            paymentsCollection.find({}).toArray(),
            reviewsCollection.find({}).toArray(),
          ]);

        const patientCount = allUsers.filter(
          (u) => u.role === "patient",
        ).length;
        const userMap = new Map(allUsers.map((u) => [u._id.toString(), u]));

        // ── Specializations breakdown ───────────────────────────────────
        const specCounts = {};
        verifiedDoctors.forEach((d) => {
          const spec = d.specialization || "General";
          specCounts[spec] = (specCounts[spec] || 0) + 1;
        });
        const specializations = Object.entries(specCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        // ── Doctor average rating (reviewsCollection থেকে) ────────────────
        const reviewsByDoctor = new Map();
        allReviews.forEach((r) => {
          const entry = reviewsByDoctor.get(r.doctorId) || { sum: 0, count: 0 };
          entry.sum += Number(r.rating || 0);
          entry.count += 1;
          reviewsByDoctor.set(r.doctorId, entry);
        });

        const doctorsWithRating = verifiedDoctors.map((d) => {
          const user = userMap.get(String(d.userId));
          const reviewStats = reviewsByDoctor.get(d._id.toString());
          return {
            _id: d._id,
            name: user?.name || "Doctor",
            image: user?.image || null,
            specialization: d.specialization || "General",
            experience: d.experience || 0,
            consultationFee: d.consultationFee || "0",
            avgRating: reviewStats ? reviewStats.sum / reviewStats.count : null,
            totalReviews: reviewStats?.count || 0,
          };
        });

        // রেটিং থাকা ডাক্তার আগে (rating অনুযায়ী), তারপর experience অনুযায়ী বাকিরা
        const featuredDoctors = doctorsWithRating
          .sort((a, b) => {
            if (a.avgRating === null && b.avgRating === null)
              return b.experience - a.experience;
            if (a.avgRating === null) return 1;
            if (b.avgRating === null) return -1;
            return b.avgRating - a.avgRating;
          })
          .slice(0, 8);

        // ── Testimonials — real review text-সহ top ৩টা ────────────────────
        const testimonials = [...allReviews]
          .filter((r) => r.reviewText && r.reviewText.trim().length > 0)
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return new Date(b.createdAt) - new Date(a.createdAt);
          })
          .slice(0, 3);

        res.json({
          stats: {
            doctors: verifiedDoctors.length,
            patients: patientCount,
            appointments: allPayments.length,
            reviews: allReviews.length,
          },
          specializations,
          featuredDoctors,
          testimonials,
        });
      } catch (error) {
        console.error("Error fetching home overview:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Public: home page overview API End
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
