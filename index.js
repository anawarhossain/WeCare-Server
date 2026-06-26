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
    const reviewsCollection = database.collection("reviews");
    const schedulesCollection = database.collection("schedules");
    const paymentsCollection = database.collection("payments");
    const prescriptionsCollection = database.collection("prescriptions");

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
    // ⬇️ আপনার existing express ফাইলে যুক্ত করুন
    // paymentsCollection = appointment/booking ডেটা (আপনি যেটাকে patientsCollection বলছেন)
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
