// ticket-booking.js
// Concurrent Ticket Booking System with seat locking and confirmation

const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Seats in memory
// Each seat: { id: "A1", status: "available"|"locked"|"booked", lockUntil?: number, lockedBy?: string }
let seats = [];

// Initialize seats (say 10 seats: A1–A10)
for (let i = 1; i <= 10; i++) {
  seats.push({ id: `A${i}`, status: "available" });
}

// Helper: check and release expired locks
function releaseExpiredLocks() {
  const now = Date.now();
  seats.forEach((seat) => {
    if (seat.status === "locked" && seat.lockUntil && now > seat.lockUntil) {
      seat.status = "available";
      delete seat.lockUntil;
      delete seat.lockedBy;
    }
  });
}

// GET /seats - list all seats with status
app.get("/seats", (req, res) => {
  releaseExpiredLocks();
  res.json({ success: true, seats });
});

// POST /seats/lock - lock a seat
// Expected JSON body: { seatId: "A1", user: "user1" }
app.post("/seats/lock", (req, res) => {
  releaseExpiredLocks();
  const { seatId, user } = req.body || {};
  if (!seatId || !user) {
    return res
      .status(400)
      .json({ success: false, message: "seatId and user are required" });
  }

  const seat = seats.find((s) => s.id === seatId);
  if (!seat) return res.status(404).json({ success: false, message: "Seat not found" });

  if (seat.status === "available") {
    seat.status = "locked";
    seat.lockedBy = user;
    seat.lockUntil = Date.now() + 60 * 1000; // lock for 1 min
    return res.json({ success: true, message: `Seat ${seatId} locked for ${user}`, seat });
  }

  if (seat.status === "locked") {
    return res.status(409).json({ success: false, message: "Seat already locked" });
  }

  if (seat.status === "booked") {
    return res.status(409).json({ success: false, message: "Seat already booked" });
  }
});

// POST /seats/confirm - confirm booking of a locked seat
// Expected JSON body: { seatId: "A1", user: "user1" }
app.post("/seats/confirm", (req, res) => {
  releaseExpiredLocks();
  const { seatId, user } = req.body || {};
  if (!seatId || !user) {
    return res
      .status(400)
      .json({ success: false, message: "seatId and user are required" });
  }

  const seat = seats.find((s) => s.id === seatId);
  if (!seat) return res.status(404).json({ success: false, message: "Seat not found" });

  if (seat.status === "locked" && seat.lockedBy === user) {
    seat.status = "booked";
    delete seat.lockUntil;
    delete seat.lockedBy;
    return res.json({ success: true, message: `Seat ${seatId} booked by ${user}`, seat });
  }

  return res.status(409).json({ success: false, message: "Seat cannot be confirmed (not locked by you or already booked)" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Ticket Booking API running on http://localhost:${PORT}`);
});
