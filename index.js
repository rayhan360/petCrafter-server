const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;
// W4rZyamF8RTnreEO petCrafter

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z6box3t.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const categoryCollection = client.db("perCrafterDB").collection("category");
    const userCollection = client.db("perCrafterDB").collection("users");
    const petsCollection = client.db("perCrafterDB").collection("pets");
    const donationCollection = client.db("perCrafterDB").collection("donation");
    const adoptCollection = client.db("perCrafterDB").collection("adoptPet");
    const paymentCollection = client.db("perCrafterDB").collection("payment");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // category related api
    app.get("/category", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    // pet related api

    // get pet to email based
    app.get("/pets", async (req, res) => {
      try {
        const search = req.query.search;

        const query = {
          petName: { $regex: new RegExp(search, "i") },
          adopted: false,
        };

        const sortItem = { addedDate: -1 };

        const result = await petsCollection
          .find(query)
          .sort(sortItem)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching pets:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/pets/user", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await petsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/pets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await petsCollection.findOne(query);
      res.send(result);
    });

    // post data
    app.post("/pets", async (req, res) => {
      const pets = req.body;
      const result = await petsCollection.insertOne(pets);
      res.send(result);
    });

    app.patch("/pets/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      // Assuming adopted is a boolean field
      const updateAdopted = {
        $set: {
          adopted: true,
        },
      };

      const result = await petsCollection.updateOne(filter, updateAdopted);
      res.send(result);
    });

    app.patch("/pets/updateAll/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          petImage: item.petImage,
          petName: item.petName,
          petAge: item.petAge,
          petLocation: item.petLocation,
          shortDescription: item.shortDescription,
          longDescription: item.longDescription,
        },
      };

      const result = await petsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // donation campaign related api
    app.get("/donation", async (req, res) => {
      const sortItem = { addedDate: -1 };
      const result = await donationCollection.find().sort(sortItem).toArray();
      res.send(result);
    });

    app.get("/donation/request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationCollection.findOne(query);
      res.send(result);
    });

    app.get("/donation/user", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await donationCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/donation", async (req, res) => {
      const donation = req.body;
      const result = await donationCollection.insertOne(donation);
      res.send(result);
    });

    app.patch("/donation/request/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updatedDonation = {
        $set: {
          pausedStatus: true,
        },
      };

      const result = await donationCollection.updateOne(
        filter,
        updatedDonation
      );
      res.send(result);
    });

    app.patch("/donation/unpaused/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updatedDonation = {
        $set: {
          pausedStatus: false,
        },
      };

      const result = await donationCollection.updateOne(
        filter,
        updatedDonation
      );
      res.send(result);
    });

    app.patch("/donation/updateDonation/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          petImage: item.petImage,
          maximumAmount: item.maximumAmount,
          petName: item.petName,
          lastDateOfDonation: item.lastDateOfDonation,
          shortDescription: item.shortDescription,
          longDescription: item.longDescription,
        },
      };

      const result = await donationCollection.updateOne(filter, updatedDoc);
      res.send(result)
    });

    // adopt pet related api
    app.get("/adopt", async (req, res) => {
      const result = await adoptCollection.find().toArray();
      res.send(result);
    });

    app.patch("/adopt/:id/accept", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        // Find the adoption request by ID
        const adoptionRequest = await adoptCollection.findOne(query);
        if (!adoptionRequest) {
          return res.status(404).send({ error: "Adoption request not found" });
        }

        // Update the adoption request status to "accepted"
        const updateAdopt = { $set: { status: "accepted" } };
        const result = await adoptCollection.updateOne(query, updateAdopt);

        // Update the petsCollection document with adoption status
        const petId = adoptionRequest.ownerId;
        const updatePet = { $set: { adoptionStatus: true } };
        await petsCollection.updateOne({ _id: new ObjectId(petId) }, updatePet);

        res.send(result);
      } catch (error) {
        console.error("Error accepting adoption request:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.post("/adopt", async (req, res) => {
      const adoption = req.body;
      const query = { ownerId: adoption.ownerId };
      const existingRequest = await adoptCollection.findOne(query);

      if (existingRequest) {
        return res.send({
          message: "You have already requested",
          insertedId: null,
        });
      }

      const result = await adoptCollection.insertOne(adoption);
      res.send(result);
    });

    // user related api
    



    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { amount } = req.body;
      const donation = parseInt(amount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: donation,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payments", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    app.get("/payments/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await paymentCollection.findOne(query);
      res.send(result);
    })

    app.get("/payments/user", async (req, res) => {
      const query = { email: req.query.email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      res.send(paymentResult);
    });

    app.delete("/payments/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await paymentCollection.deleteOne(query);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("PetCrafter server is running");
});

app.listen(port, () => {
  console.log(`PetCrafter Server listening on port ${port}`);
});
