const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
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
    const donationCollection = client.db("perCrafterDB").collection("donation")

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
      const email = req.query.email;
      const query = {email: email};
      const result = await petsCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/pets/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await petsCollection.findOne(query)
      res.send(result)
    })

    // post data 
    app.post("/pets", async (req, res) => {
      const pets = req.body;
      const result = await petsCollection.insertOne(pets)
      res.send(result)
    })

    app.patch("/pets/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          petImage: item.petImage,
          petName: item.petName,
          petAge: item.petAge,
          petLocation: item.petLocation,
          shortDescription: item.shortDescription,
          longDescription: item.longDescription
        }
      };

      const result = await petsCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    // donation campaign related api
    app.get("/donation", async (req, res) => {
      const email = req.query.email;
      const query = {email: email};
      const result = await donationCollection.find(query).toArray()
      res.send(result)
    })
    
    app.post("/donation", async (req, res) => {
      const donation = req.body;
      const result = await donationCollection.insertOne(donation)
      res.send(result)
    })



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
