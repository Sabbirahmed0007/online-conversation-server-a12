const express = require('express');
const cors = require('cors');
const cookieParser=require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require ('dotenv').config();
const app = express();
const port = process.env.PORT || 3000 ;

// middleWares

app.use(cors({
  origin:['http://localhost:5173', 'https://online-conversation-project.web.app'],
  credentials:true

}));
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
    const memberShipCollection = client.db('data').collection('membership');
    const announcementsCollection = client.db('data').collection('announcements');


     // jwt token related api
     app.post('/jwt', async(req, res)=>{
      const user = req.body;
    
      const token= jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {expiresIn: '2hr'}) ;  
      res.send({token});
    })


    //// middleware 

    const verifyToken =(req, res, next)=>{
      console.log(req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'Unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      console.log(token);
      jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (error, decoded)=>{

        if(error){
          return res.status(401).send('Unauthorized access')
        }
        req.decoded = decoded;
        next();
      })
      
    }

    // use verify admin after veryfy token 
    const verifyAdmin =async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      const isAdmin= user?.role === 'admin';
      if(!isAdmin){
        return res.status(403).send({message: 'forbidden access'});
      }
      next()
    }





    // User related api-------------------------------------

    app.get('/users',verifyToken, verifyAdmin, async(req, res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result);
    })


    app.get('/users/admin/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message : 'forbidden access'})
      }
      const query = {email: email};
      const user= await usersCollection.findOne(query);
      let admin =false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin});
    })
    

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

    // update the user role to admin
    app.patch('/users/admin/:id', async(req, res)=>{
      const id= req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc ={
        $set: {
          role: 'admin',
        }
      }
      const result = await usersCollection.updateOne (filter, updatedDoc);
      res.send(result);
    })

    // to delete the user from the database
    app.delete('/users/:id',verifyToken, verifyAdmin, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })
    
    // -----------------------
    app.get('/tags', async(req, res)=>{
      const result = await tagsCollection.find().toArray();
      res.send(result);
    })

    app.post('/tags',verifyToken, verifyAdmin, async(req, res)=>{
      const data = req.body;
      const result = await tagsCollection.insertOne(data);
      res.send(result);
    })

    /// announcements related api -------------

    app.get('/announcements',  async(req, res)=>{
      const result = await announcementsCollection.find().toArray();
      res.send(result);
    })

    app.get('/announcementsCount', async(req, res)=>{
      const count = await announcementsCollection.estimatedDocumentCount();
      res.send([count]);
    })

    app.post('/createAnnouncement',verifyToken, verifyAdmin, async(req, res)=>{
      const query = req.body;
      const result = await announcementsCollection.insertOne(query);
      res.send(result);
    })


    // membership related api
    app.get('/primiumMemberShip',verifyToken, async(req, res )=>{
      const email = req.query.email;
      const query = {email: email};
      const result = await memberShipCollection.find(query).toArray();
      res.send(result); 
    })

    ///// Post related api
    app.get('/posts', async(req, res)=>{
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result= await postCollection.find().toArray();
      res.send(result);
      
    })

    // app.get('/myPosts/:email', async(req, res)=>{
    app.get('/myPosts/:email',verifyToken, async(req, res)=>{
      const email = req.query.email;
      // const email = req.params.email;
      const filter = {email: email};
      const result = await postCollection.find(filter).toArray();
      res.send(result);
    })

    app.get('/postDetails/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await postCollection.findOne(query);
      console.log(result)
      res.send(result);
    })

/// My post s delete
    app.delete('/myPosts/:id',verifyToken, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await postCollection.deleteOne(query);
      res.send(result);
    })


     /// Pagination data
     app.get('/allPosts', async(req, res)=>{
      const count =await postCollection.estimatedDocumentCount();
      res.send({count});
  })

    app.post('/addposts',verifyToken, async(req, res)=>{
      const query = req.body;
      query.createdAt = new Date();
      const result = await postCollection.insertOne(query);
      res.send(result);
    })


    ///// Admin home stats
    app.get('/adminStats',verifyToken, verifyAdmin, async(req, res)=>{
      const users = await usersCollection.estimatedDocumentCount();
      const posts = await postCollection.estimatedDocumentCount();

      res.send({users, posts});
    })

    



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