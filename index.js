const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;

const bcrypt = require('bcrypt');
const saltRounds = 10;

require('dotenv').config();
const app = express();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ieei5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(express.static('boarders'));
app.use(fileUpload());


app.get('/', (req, res) => {

   res.send("server working");

})

client.connect(err => {
   console.log(err)

   const userCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL1);
   const foodCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL2);
   const orderCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL3);

   console.log("connected")

   app.post('/signup', async (req, res) => {
      const { name, contact, email, address, password, admin, user } = req.body;
      // console.log(req.body)

      userCollection.find({ email: email })
         .toArray((err, result) => {
            // console.log(result)
            if (result.length > 0) {
               console.log("user found")
               res.send(false);
            }
            else {

               bcrypt.genSalt(saltRounds, (err, salt) => {

                  bcrypt.hash(password, salt, (err, hashPassword) => {

                     const guestImg = req.body.base64;
                     const imgSize = req.body.fileSize;
                     const type = req.body.type;


                     const image = {
                        contentType: type,
                        size: imgSize,
                        img: Buffer.from(guestImg, 'base64')
                     };

                     const newUser = {
                        name: name,
                        contact: contact,
                        email: email,
                        address: address,
                        password: hashPassword,
                        admin: admin,
                        user: user,
                        ...image

                     }

                     userCollection.insertOne(newUser)
                        .then(result => {
                           console.log("ascheeee", result)
                           res.send(result.acknowledged);
                        })


                  })
               })
            }





         })
   })


   app.post('/addFoods', (req, res) => {

      const { base64, fileSize, type, title, description, price } = req.body

      const image = {
         contentType: type,
         size: fileSize,
         img: Buffer.from(base64, 'base64')
      };
      const foodInfo = { title: title, description: description, price: price, ...image }
      console.log(foodInfo);
      foodCollection.insertOne(foodInfo)
         .then(result => {
            res.send(result.acknowledged)
         })
   })



   app.get('/allFoods', (req, res) => {
      console.log(req.body)

      foodCollection.find({})
         .toArray((err, documents) => {
            // console.log(documents)
            res.send(documents);
         })
   })



   app.delete('/deleteFood/:id', (req, res) => {
      foodCollection.deleteOne({ _id: ObjectId(req.params.id) })
         .then(result => {
            res.send(result.deletedCount > 0);
         })
   })
   app.patch('/updateFoodInfo/:id', (req, res) => {
      console.log(req.body)
      const { title, description, price } = req.body
      foodCollection.updateOne({ _id: ObjectId(req.params.id) },
         {
            $set: {
               title: title,
               description: description,
               price: price,
            }
         })
         .then((result) => {
            res.send(result.modifiedCount > 0)
         });
   })


   //room section end



   app.post('/login', (req, res) => {
      const myPassword = req.body.password;
      console.log(req.body)

      userCollection.find({ email: req.body.email })
         .toArray((err, documents) => {
            const info = { ...documents[0] };
            // console.log(info)
            if (documents.length) {
               bcrypt.compare(myPassword, info.password, function (err, response) {
                  if (response) {
                     res.json({ info: info, message: "Login successful", login: true });
                  }
                  else {
                     res.json({ message: "Email or password is incorrect", login: false });
                  }
               });
            } else {
               res.send({ message: "You are not an user. Please register now.", login: false });
            }
         })


   })

   app.post('/placeOrder', (req, res) => {

      console.log(req.body)

      orderCollection.insertOne({ ...req.body, orderDate: new Date().toDateString() })
         .then(result => {
            res.send(result.acknowledged)
         })

   })

   app.get('/orders', (req, res) => {
      // console.log("hi")
      orderCollection.find({})
         .toArray((err, documents) => {
            res.send(documents);
         })
   })


   app.patch('/updateStatus', (req, res) => {
      console.log(req.body)
      
      const { status, _id, email } = req.body

      orderCollection.updateOne({ _id: ObjectId(_id) },
         {
            $set: {
               status: status
            }
         })
         .then((result) => {
            // res.send(result.modifiedCount > 0)
            if (result.modifiedCount > 0) {


               res.send(result.modifiedCount > 0)

            } else {
               res.send(result.modifiedCount < 0)
            }
         });
   })


});

app.listen(process.env.PORT || 8085);


