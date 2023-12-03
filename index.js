const express = require('express');
const cors = require('cors');
const cookieParser=require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require ('dotenv').config();
const app = express();
const port = process.env.PORT || 3000 ;

// middleWares

app.use(cors());
app.use(express.json());
app.use(cookieParser());




/// Connecting mongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fbdpykk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const postCollection = client.db('data').collection('posts');
    const usersCollection = client.db('data').collection('users');
    const tagsCollection = client.db('data').collection('tags');
    const announcementsCollection = client.db('data').collection('announcements');



    // User related api-------------------------------------

    

    app.post('/users', async(req, res)=>{
        let user = req.body;
        const query= {email: user.email}

      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'User already exist', insertedId: null})
      }
      const result= await usersCollection.insertOne(user);
      res.send(result);
    })

    app.patch('/users/admin/:id', async(req, res)=>{
      const id= req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc ={
        $set: {
          role: 'admin',
        }
      }
      const result = await usersCollection.updateOne (filter,updatedDoc);
      res.send(result);
    })
    
    // -----------------------
    app.get('/tags', async(req, res)=>{
      const result = await tagsCollection.find().toArray();
      res.send(result);
    })

    /// 



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











app.get('/', (req, res)=>{
    res.send("Hello users! what's going on ");
})

app.listen(port, ()=>{
    console.log(`Server is running at http://localhost:${port}`);
})