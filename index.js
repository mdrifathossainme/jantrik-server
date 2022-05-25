const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cwubk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run=async()=>{
        try{
            await client.connect();
            const productCollection = client.db('assigment12').collection('products')
            const reviewsCollection = client.db('assigment12').collection('reviews')
            const orderCollection = client.db('assigment12').collection('order')
            const userCollection = client.db('assigment12').collection('user')

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
            app.get('/myorder', async (req, res) => {
                const email = req.query.email;
           
                const queary = { email }
                const result= await orderCollection.find(queary).toArray()
                res.send(result)
               
            })






            app.post('/order', async (req, res) => {
                const order = req.body;
                const quary = { productname:order.email}
                const exists = await orderCollection.findOne(quary)
                if (exists) {
                    return res.send({success:false,product:exists})
                }
                const result = await orderCollection.insertOne(order)
                res.send(result)
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
                res.send({result})
            })



            app.put('/user/admin/:email', async (req, res) => {
                const email = req.params.email;;
                console.log(email)
                const filter = { email: email };
                const updateDoc = {
                    $set:{role:"admin"},
                };
                const result = await userCollection.updateOne(filter, updateDoc)
                res.send(result)
           })






            app.delete('/orderdeleted/:id', async (req, res) => {
                const id = req.params.id;
                const quray = { _id: ObjectId(id) }
                const result = await orderCollection.deleteOne(quray)
               res.send(result)
            })

        }
        finally{
            
        }
}
run().catch(console.dir)

app.get('/',(req,res)=>{
    res.send('Assignment 12')
})
app.listen(port)