const express = require("express");
const router = express.Router();
const application = require("../Model/Application");
const Subscription = require("../Model/Subscription");

router.post("/", async (req, res) => {
  try {
    const userUid = req.body.user?.uid || req.body.user?._id;
    if (!userUid) return res.status(400).json({ error: "User ID required" });

    // Find or create subscription
    let sub = await Subscription.findOne({ userUid });
    if (!sub) {
      sub = new Subscription({ userUid });
      await sub.save();
    }

    // Reset usage if a month has passed
    const now = new Date();
    const lastReset = new Date(sub.lastApplicationReset);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      sub.applicationsThisMonth = 0;
      sub.lastApplicationReset = now;
      
      // Also check if plan expired
      if (sub.planExpiry && now > sub.planExpiry) {
          sub.plan = "Free";
      }
      await sub.save();
    } else if (sub.planExpiry && now > sub.planExpiry && sub.plan !== "Free") {
      sub.plan = "Free";
      await sub.save();
    }

    // Check limits
    const limits = { Free: 1, Bronze: 3, Silver: 5, Gold: Infinity };
    const limit = limits[sub.plan] || 1;

    if (sub.applicationsThisMonth >= limit) {
      return res.status(403).json({ error: `You have reached your limit of ${limit} application(s) for the ${sub.plan} plan this month.` });
    }

    // Process application
    const applicationipdata = new application({
      company: req.body.company,
      category: req.body.category,
      coverLetter: req.body.coverLetter,
      user: req.body.user,
      Application: req.body.Application,
      body: req.body.body,
    });

    const data = await applicationipdata.save();
    
    // Increment usage
    sub.applicationsThisMonth += 1;
    await sub.save();

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const data = await application.find();
    res.json(data).status(200);
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await application.findById(id);
    if (!data) {
      res.status(404).json({ error: "application not found" });
    }
    res.json(data).status(200);
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "internal server error" });
  }
});
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  let status;
  if (action === "accepted") {
    status = "accepted";
  } else if (action === "rejected") {
    status = "rejected";
  } else {
    res.status(404).json({ error: "Invalid action" });
    return;
  }
  try {
    const updateapplication = await application.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updateapplication) {
      res.status(404).json({ error: "Not able to update the application" });
      return;
    }
    res.status(200).json({ sucess: true, data: updateapplication });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
});
module.exports = router;