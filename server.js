const express = require("express");
const redis = require("redis");
const User = require("./models/user");
const { config } = require("dotenv");
const dbConnect = require("./database");
const { EventEmitter } = require("events");
let loginTotal;
let SignUpTotal;
let loginData;
let SignUpDate;

const app = express();
config();

const GeneraterandomEvent = () => {
  const event = new EventEmitter();
  const ids = [
    "INF-yj562hjojzbtez",
    "INF-3gbfcjjsd6vhvo",
    "INF-ixpktk3itsk86",
    "INF-1bi5qk0zocqcz",
  ];
  const eventcheck = ["formsubmit", "click"];
  event.on("eventEmit", async (data) => {
    const user = await User(data);
    await user.save();
  });
  setInterval(() => {
    for (let i = 0; i < 5; i++) {
      event.emit("eventEmit", {
        trackingId: ids[Math.floor(Math.random() * 4) + 0],
        event: eventcheck[Math.floor(Math.random() * 2) + 0],
        timestamp: new Date(),
      });
    }
  }, 1000);
};

// uncomment it when you want to emit event to save dummy data in Database

// GeneraterandomEvent();

const client = redis.createClient(process.env.REDIS_PORT);

const cache = (req, res, next) => {
  client.get("cachedUserInfo", (err, data) => {
    if (err) throw err;
    if (data !== null) {
      return res.status(200).json({ from: "Cache", data: JSON.parse(data) });
    } else {
      next();
    }
  });
};
app.get("/api/check_visitor", cache, async (req, res) => {
  this.loginTotal = 0;
  this.SignUpTotal = 0;
  this.loginData = {};
  this.SignUpData = {};
  const users = await User.aggregate([
    {
      $match: { timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } },
    },
    {
      $group: {
        _id: { event: "$event", trackingId: "$trackingId" },
        countNumber: { $sum: 1 },
      },
    },
  ]);
  users.map((user) => {
    if (user._id.event === "formsubmit") {
      this.loginTotal += user.countNumber;
      Object.assign(this.loginData, {
        [user._id.trackingId]: user.countNumber,
      });
    } else {
      this.SignUpTotal += user.countNumber;
      Object.assign(this.SignUpData, {
        [user._id.trackingId]: user.countNumber,
      });
    }
    return {
      event: user._id.event,
      [user._id.trackingId]: user.countNumber,
    };
  });
  const repos = {
    signup: {
      totalEventsCaptured: this.loginTotal,
      eventsCapturedByTrackingIds: this.loginData,
    },
    click: {
      totalEventsCaptured: this.SignUpTotal,
      eventsCapturedByTrackingIds: this.SignUpData,
    },
  };
  client.setex("cachedUserInfo", 300, JSON.stringify(repos));
  return res.status(200).json({
    from: "API",
    data: {
      signup: {
        totalEventsCaptured: this.loginTotal,
        eventsCapturedByTrackingIds: this.loginData,
      },
      click: {
        totalEventsCaptured: this.SignUpTotal,
        eventsCapturedByTrackingIds: this.SignUpData,
      },
    },
  });
});

app.listen(process.env.PORT, () => {
  dbConnect();
  console.log(`app running on port ${process.env.PORT}`);
});
