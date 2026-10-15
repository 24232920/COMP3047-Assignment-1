var express = require('express');
var router = express.Router();
const { connectToDB, ObjectId } = require('../utils/db'); //activate later

/* GET home page. */
router.get('/', async function (req, res) {
  try {
    const db = await connectToDB();
    const events = await db.collection("events").find({}).toArray();
    const now = new Date();

    const isHighlighted = (event) =>
      event.highlights === true ||
      event.highlights === "true" ||
      event.highlights === "on";

    const highlightedEvents = events
      .filter(isHighlighted)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    const upcomingEvents = events
      .filter((event) => {
        const date = new Date(event.eventDate);
        const status = String(event.status || "").trim().toLowerCase();

        return status === "upcoming" &&
          !Number.isNaN(date.getTime()) &&
          date > now;
      })
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .slice(0, 6);

    const latestEvents = events
      .filter((event) => {
        const date = new Date(event.eventDate);
        return !Number.isNaN(date.getTime()) && date > now;
      })
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      .slice(0, 6);

    res.render("index", {
      highlightedEvents,
      upcomingEvents,
      latestEvents
    });
  } catch (err) {
    next(err);
  }
});

/* GET Event Form. */
router.get("/event/add", async function (req, res) {
  try {
    const db = await connectToDB();

    const venues = await db.collection("venues")
      .find({})
      .sort({ venueName: 1 })
      .toArray();

    res.render("eventform", {
      venues,
      event: null
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* GET Venue Form. */
router.get('/venue/add', function (req, res, next) {
  res.render('venueform', { title: 'Express' });
});

/* Handle Event Form */
router.post('/event/add', async function (req, res, next) {
  const db = await connectToDB();
  try {
    req.body.capacity = parseInt(req.body.capacity);
    req.body.highlights = req.body.highlights ? true : false;
    req.body.created_at = new Date();

    let result = await db.collection("events").insertOne(req.body);
    // res.status(201).json({ id: result.insertedId });
    return res.redirect(303, "/events");

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Display event update form
router.get('/event/edit/:id', async function (req, res) {
  try {
    const db = await connectToDB();

    const event = await db.collection("events").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const venues = await db.collection("venues")
      .find({})
      .sort({ venueName: 1 })
      .toArray();

    res.render('eventedit', { event, venues });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Update Event Form.
router.post('/event/edit/:id', async function (req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).send("Invalid event ID");
    }

    const eventCapacity = Number.parseInt(req.body.eventCapacity, 10);

    if (!Number.isInteger(eventCapacity)) {
      return res.status(400).send("Enter a valid event capacity");
    }

    const db = await connectToDB();

    const updateFields = {
      eventTitle: req.body.eventTitle,
      eventDescription: req.body.eventDescription,
      category: req.body.category,
      eventDate: req.body.eventDate,
      speaker: req.body.speaker,
      eventCapacity,
      eventVenue: req.body.eventVenue || "",
      status: req.body.status,
      eventBanner: req.body.eventBanner || "",
      // Unchecked checkboxes are omitted from form submissions.
      highlights: req.body.highlights === "on"
    };

    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("Event not found");
    }

    // This succeeds even if the submitted values were unchanged.
    return res.redirect("/events");
  } catch (err) {
    return res.status(400).send(err.message);
  }
});


// Delete Event.
// router.post('/event/delete/:id', async function (req, res) {
//   const db = await connectToDB();
//   try {
//     let result = await db.collection("events").deleteOne({ _id: new ObjectId(req.params.id) });
//     if (result.deletedCount > 0) {
//       res.status(200).json({ message: "Event deleted" });
//     } else {
//       res.status(404).json({ message: "Event not found" });
//     }
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

/* Handle Venue Form */
router.post('/venue/add', async function (req, res, next) {
  const db = await connectToDB();
  try {
    req.body.numTickets = parseInt(req.body.numTickets);
    req.body.terms = req.body.terms ? true : false;
    req.body.created_at = new Date();

    let result = await db.collection("venues").insertOne(req.body);
    // res.status(201).json({ id: result.insertedId });
    return res.redirect(303, "/venues");

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Display all Events */
router.get('/events', async function (req, res) {
  const db = await connectToDB();
  try {
    let results = await db.collection("events").find().toArray();
    res.render('events', { events: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Display all Venues */
router.get('/venues', async function (req, res) {
  const db = await connectToDB();
  try {
    let results = await db.collection("venues").find().toArray();
    res.render('venues', { venues: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//display venue update form
router.get('/venue/edit/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    let result = await db.collection("venues").findOne({ _id: new ObjectId(req.params.id) });
    if (result) {
      res.render('venuedit', { venue: result });
    } else {
      res.status(404).json({ message: "Venue not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Venue Form.
router.post('/venue/edit/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    let facilities = req.body.facilities ?? [];
    if (!Array.isArray(facilities)) {
      facilities = [facilities];
    }

    await db.collection("venues").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          venueName: req.body.venueName,
          venueLocation: req.body.venueLocation,
          venueCapacity: Number.parseInt(req.body.venueCapacity, 10),
          venueDescription: req.body.venueDescription,
          facilities
        }
      }
    );

    let result = await db.collection("venues").updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });

    if (result.modifiedCount > 0) {
      return res.redirect(303, "/venues");

    } else {
      res.status(404).json({ message: "Venue not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Venue.
router.post('/venue/delete/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    let result = await db.collection("venues").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      return res.redirect(303, "/venues");
    } else {
      res.status(404).json({ message: "Venue not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* Display Event Details */
router.get('/event/detail/:id', async function (req, res) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const db = await connectToDB();

    const event = await db.collection("events").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // This assumes event.eventVenue stores the venue name.
    const venue = event.eventVenue
      ? await db.collection("venues").findOne({
        venueName: event.eventVenue
      })
      : null;

    res.render("eventdetail", { event, venue });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Delete Event
router.post('/event/delete/:id', async function (req, res) {
  const db = await connectToDB();
  try {
    let result = await db.collection("events").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      return res.redirect(303, "/events");
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Unknown GET routes
router.use(function (req, res, next) {
  if (req.method === "GET") {
    return res.status(404).render("404");
  }

  next();
});

// Server errors passed with next(err)
router.use(function (err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).render("error", {
    message: err.message || "An unexpected server error occurred."
  });
});

module.exports = router;