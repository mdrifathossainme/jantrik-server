const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
app.use(express.json())
app.use(cors())

 const verifyJWT=(req, res, next)=> {
     const authorization = req.headers.authorization
     if (!authorization) {
         return res.status(401).send(' UnAthorized Access')
     }
     const token = authorization.split(' ')[1]
     jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
         if (err) {
             res.status(403).send({message:"Fobidden Access"})
         }
         req.decoded = decoded
            next()
     })
  
 }


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cwubk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const run=async()=>{
        try{
            await client.connect();
            const productCollection = client.db('assigment12').collection('products')
            const reviewsCollection = client.db('assigment12').collection('reviews')
            const orderCollection = client.db('assigment12').collection('order')
            const userCollection = client.db('assigment12').collection('user')
            const paymentCollection = client.db('assigment12').collection('payment')

            app.get('/products',async (req, res) => {
                const quary = {}
                const result = await productCollection.find(quary).toArray()
                res.send(result)
            })
            app.get('/products/:id', async (req, res) => {
                const id = req.params.id
                const quary = {_id:ObjectId(id)}
                const result = await productCollection.findOne(quary)
                res.send(result)
            })
            
            app.get('/reviews',async (req, res) => {
                const quary = {}
                const result = await reviewsCollection.find(quary).toArray()
                res.send(result)
            })
            app.get('/alluser',async (req, res) => {
                const quary = {}
                const result = await userCollection.find(quary).toArray()
                res.send(result)
            })
            app.get('/myorder',verifyJWT, async (req, res) => {
                const email = req.query.email; 
                const decodedEmail = req.decoded.email
                if (decodedEmail === email) {
                  const queary = { email }
                const result= await orderCollection.find(queary).toArray()
                res.send(result)
                }
                else {
                    res.status(403).send({ message: "forbidden access" });
               }
               
            })
            app.get('/myorder/:id', async (req, res) => {
                const id = req.params.id;
                const filter = { _id: ObjectId(id) }
                const result = await orderCollection.findOne(filter)
                res.send(result)    
            })

            
            app.get('/admin/:email', async(req,res)=>{
                const email= req.params.email
                const user= await userCollection.findOne({email:email})
                const isAdmin=user?.role==="admin"
                res.send({admin:isAdmin})
            })
            
            app.get('/user/:email', async(req,res)=>{
                const email= req.params.email
                const user= await userCollection.findOne({email:email})
                res.send(user)
            })
            app.get('/manageorder', async(req,res)=>{
                const quary= {}
                const order= await orderCollection.find(quary).toArray()
                res.send(order)
            })



            app.post('/order', async (req, res) => {
                const order = req.body;
                const quary = { productname:order.productname,email: order.email }
                const exists = await orderCollection.findOne(quary)
               
                
                if (exists) {
                    return res.send({success:false,product:exists})
                }
                const result = await orderCollection.insertOne(order)
                res.send(result)
            })
           
        app.post('/create-payment-intent', async(req,res)=>{
                const service=req.body;
                const price=service.price;
                const amount=price*100;
                const paymentIntent=await stripe.paymentIntents.create({
                    amount:amount,
                    currency:"usd",
                    payment_method_types:['card']
                });
                res.send({clientSecret: paymentIntent.client_secret})
        })
            app.post('/review', async(req,res)=>{
            const review = req.body;
            const result = await reviewsCollection.insertOne(review)
            res.send(result)
                
            })
            app.post('/addproduct', async(req,res)=>{
            const product = req.body;
            const result = await productCollection.insertOne(product)
            res.send(result)
                
            })
    

         app.patch('/complateorder/:id',async(req,res)=>{
                const id= req.params.id;
                const payment= req.body;
                const filter={_id:ObjectId(id)}
                const updateDoc={
                    $set:{
                        paid:true,
                        transactionId:payment.transactionId
                    }
                }
                const result= await paymentCollection.insertOne(payment)
                const updatedBooking=await orderCollection.updateOne(filter,updateDoc)
                res.send(updateDoc)
            })
     
            app.put('/user/:email', async (req, res) => {
                const email = req.params.email;
                const user = req.body;
                const filter = { email: email };
                const options = { upsert: true };
                const updateDoc = {
                    $set: user,
                };
                const result = await userCollection.updateOne(filter, updateDoc, options)
                const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: "2d" })
                res.send({result,token})
            })



            app.put('/user/admin/:email',verifyJWT, async (req, res) => {
                const email = req.params.email;
                const request = req.decoded.email
                const emailRole = await userCollection.findOne({ email: request });
                if (emailRole.role === "admin") {
                    const filter = { email: email };
                const updateDoc = {
                    $set:{role:"admin"},
                };
                const result = await userCollection.updateOne(filter, updateDoc)
                res.send(result)
                }
                else {
                    res.status(403).send({message:"Forbident Access"})
                }
              
           })
          app.put('/user/upprofile/:email', async (req, res) => {
                const email = req.params.email;
                const deatols = req.body;
                const filter = { email: email };
               const options = { upsert: true };
                const updateDoc = {
                    $set:deatols,
                };
                const result = await userCollection.updateOne(filter, updateDoc,options)
                res.send(result)
                }
              
            )
            app.put('/product/:id', async (req, res) => {
                const id = req.params.id;
                const updateDoc = req.body;
                const filter = { _id: ObjectId(id) }
                console.log(updateDoc,filter)

                const option = { upsert: true }
                const upDoc = {
                    $set:updateDoc
                }
                const result= await productCollection.updateOne(filter,upDoc,option)
               res.send(result)
            })

            
            app.delete('/orderdeleted/:id', async (req, res) => {
                const id = req.params.id;
                const quray = { _id: ObjectId(id) }
                const result = await orderCollection.deleteOne(quray)
               res.send(result)
            })

            app.delete('/product/:id', async (req, res) => {
                const id = req.params.id;
                const quray = { _id: ObjectId(id) }
                const result = await productCollection.deleteOne(quray)
               res.send(result)
            })

           
        }
        finally{
            
        }
}
run().catch(console.dir)

app.get('/',(req,res)=>{
    res.send('Assignment12 ')
})
app.listen(port)