const express = require("express")
const mongoose = require('mongoose')
const cors = require("cors")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const ReceiverModel = require('./models/Receiver')

const app = express()
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
}))
app.use(cookieParser())
// mongodb+srv://rakshitavipperla:02082003@cluster0.ddgcldq.mongodb.net/?retryWrites=true&w=majority
const dbURL= "mongodb+srv://rakshitavipperla:02082003@cluster0.ddgcldq.mongodb.net/?retryWrites=true&w=majority";



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

app.post('/register',(req, res) => {
    const {name, email, password} = req.body;
    bcrypt.hash(password, 10)
    .then(hash => {
        ReceiverModel.create({name, email, password: hash})
        .then(user => res.json("Success"))
        .catch(err => res.json(err))
    }).catch(err => res.json(err))
})

app.post('/login', (req, res)=> {
    const {email, password} = req.body;
    console.log(email, password);
    ReceiverModel.findOne({email: email})
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

app.post('/getUserData', (req, res)=> {
    console.log(req.body);
    console.log("I am calling");
    ReceiverModel.find({email:req.body.email})
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
});


app.listen(3001, () => {
    console.log("server is running")
}) 