require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Vedhak Is Running");
});
// const dbConnect = async () => {
//     try {
//       client.connect();
//       console.log(" Database Connected Successfully✅ ");

//     } catch (error) {
//       console.log(error.name, error.message);
//     }
//   }
//   dbConnect()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.54td47o.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).send({ error: true, message: "Unauthorized Access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.Access_Token, function (err, decoded) {
    if (err) {
      res.status(403).send({ error: true, message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const UsersCollections = client.db("Users").collection("User");
    const InstructorsClassCollections = client
      .db("instructorsClasses")
      .collection("instructorsClass");
    const classesCollections = client.db("classes").collection("class");
    const InstructorsCollections = client
      .db("Instructors")
      .collection("Instructor");
    // Send a ping to confirm a successful connection
    app.get("/instructors", async (req, res) => {
      const result = await InstructorsCollections.find().toArray();
      res.send(result);
    });
    app.get("/classes", async (req, res) => {
      const result = await classesCollections.find().toArray();
      res.send(result);
    });
    app.post("/classes", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await classesCollections.insertOne(data);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const result = await UsersCollections.find().toArray();
      res.send(result);
    });
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ isAdmin: false });
      }
      const query = { email: email };
      const user = await UsersCollections.findOne(query);
      const result = { admin: user?.role === "admin" };

      res.send(result);
    });
    app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ isInstructor: false });
      }
      const query = { email: email };
      const user = await UsersCollections.findOne(query);
      const result = { instructor: user?.role === "instructor" };

      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await UsersCollections.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already Exist" });
      }
      console.log(existingUser);
      const result = await UsersCollections.insertOne(user);
      res.send(result);
    });
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log("user", user);
      const token = jwt.sign(user, process.env.Access_Token);
      res.send({ token });
    });
    app.post("/instructorsClasses", async (req, res) => {
      const data = req.body;
      const result = await InstructorsClassCollections.insertOne(data);
      res.send(result);
    });
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: `admin`,
        },
      };
      const result = await UsersCollections.updateOne(query, updateDoc);
      res.send(result);
    });
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: `instructor`,
        },
      };
      const result = await UsersCollections.updateOne(query, updateDoc);
      res.send(result);
    });

    app.delete("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollections.deleteOne(query);
      res.send(result);
    });
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

app.listen(PORT, () => {
  console.log(`Vedhak is Running at ${PORT}`);
});
