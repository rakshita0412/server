const express = require("express")
const mongoose = require('mongoose')
const cors = require("cors")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const UserModel = require('./models/User')
const UserDataModel = require('./models/Userdata');

const app = express()
app.use(express.json())
app.use(cors
     ({
     origin: ["http://localhost:3000"],
     methods: ["GET", "POST"],
    credentials: true
 })
)
app.use(cookieParser())
// mongodb+srv://rakshitavipperla:02082003@cluster0.ddgcldq.mongodb.net/?retryWrites=true&w=majority
const dbURL= "mongodb+srv://rakshitavipperla:02082003@cluster0.ddgcldq.mongodb.net/lau?retryWrites=true&w=majority";


mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error);
    });
  


// Create a new user data document
async function createUserData(email) {
    console.log("im called");
    try {
        const newUserData = new UserDataModel({
            email,
            data: {
                loginDates:[] ,
                loginTime: [{}],
                loginCountPerDay: [{}],
                IPaddress:[{}],
                loginCount: 0
            }
            
        });
        await newUserData.save();
        console.log('User data created successfully:', newUserData);
        return newUserData;
    } catch (error) {
        console.error('Error creating user data:', error);
        throw error;
    }
}



// Query user data based on email
async function getUserDataByEmail(email) {
    try {
        const userData = await UserDataModel.findOne({ email });
        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}




const varifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return  res.json("Token is missing")
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if(err) {
                return res.json("Error with token")
            } else {
                if(decoded.role === "admin") {
                    next()
                } else { 
                    return res.json("not admin")
                }
            }
        })
    } 
}    

app.get('/dashboard',varifyUser ,(req, res) => {
    res.json("Success")
})


app.post("/updateUserData", (req,res)=>{
    console.log(req.body)
    res.json({"message":"hii"})

    const userEmail = 'rakshitavipperla@gmail.com';

UserDataModel.findOne({ email: userEmail })
  .then((userData) => {
    if (!userData) {
      res.status(404).json({ message: 'User data not found' });
      return;
    }

    // Format the data as per your desired output
    const formattedData = {
     
    };

    res.json(formattedData);
  })
  .catch((error) => {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  });
})


app.post('/register',(req, res) => {
    const {name, email, password} = req.body;
    bcrypt.hash(password, 10)
    .then(hash => {
        UserModel.create({name, email, password: hash})
        .then(user => {
            res.json({status: "Success"});
                    // Create user data document after user registration
                    createUserData(email);
        })
        .catch(err => res.json(err))
    }).catch(err => res.json(err))


})



    // Create a new user data document
    // async function createUserData(email) {
    //     try {
    //         const newUserData = new UserDataModel({
    //             email : email,
    //             data : userData,
    //         });
    //         await newUserData.save();
    //         console.log('User data created successfully:', newUserData);
    //         return newUserData;
    //     } catch (error) {
    //         console.error('Error creating user data:', error);
    //         throw error;
    //     }
    // }

    




app.post('/login', (req, res)=> {
    const {email, password} = req.body;
    console.log(email, password);
    UserModel.findOne({email: email})
    .then(user => {
        if(user) {
            bcrypt.compare(password, user.password, (err, response) => {
                if(response) {
                    console.log(response.data);
                  const token = jwt.sign({email: user.email, role: user.role}, "jwt-secret-key", {expiresIn: '1d'})
                  res.cookie('token', token)
                    return res.json({Status: "Success", role: user.role})
                } else {
                    return res.json({Status:"the password is invalid"})
                }
            })
        } else {
            return res.json("No records exist")
        }    
    })
})


app.listen(3002, () => {
    console.log("server is running")
}) 










// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://rakshitavipperla:02082003@cluster0.ddgcldq.mongodb.net/lau?retryWrites=true&w=majority";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("lau").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);



// Query user data based on email
async function getUserDataByEmail(email) {
    try {
        const userData = await UserDataModel.findOne({ email });
        return userData;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}
