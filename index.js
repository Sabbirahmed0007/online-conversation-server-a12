const express = require('express');
const cors = require('cors');
const cookieParser=require('cookie-parser');
require ('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

// middleWares

app.use(cors());
app.use(express.json());
app.use(cookieParser());




/// Connectiong mongoDB









app.get('/', (req, res)=>{
    res.send("Hello users! what's going on ");
})

app.listen(port, ()=>{
    console.log(`Server is running at http://localhost:${port}`);
})