const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const UserModel = require('./models/User');
const UserDataModel = require('./models/Userdata');
const axios = require('axios');


const app = express();
app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    })
);
app.use(cookieParser());


//app.enable('trust proxy'); // Enable proxy support in Express


const dbURL = "mongodb+srv://rakshitavipperla:02082003@cluster0.ddgcldq.mongodb.net/lau?retryWrites=true&w=majority";

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
async function createUserData(email, userData) {
    console.log("I'm called");
    try {
        const newUserData = new UserDataModel({
            email: email,
            data: userData,
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

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json("Token is missing");
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) {
                return res.json("Error with token");
            } else {
                if (decoded.role === "admin") {
                    next();
                } else {
                    return res.json("Not admin");
                }
            }
        });
    }
};

app.get('/dashboard', verifyUser, (req, res) => {
    res.json("Success");
});
  

// Create a POST route for /getapi
app.post('/getapi', async (req, res) => {
    try {
      // Assuming you want to collect and send data from the client-side Axios GET request
      const { api } = req.body;
  
      // Use the received data to create the OpenWeatherMap API URL
      //const openWeatherMapAPI = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${f063a2165625a04f3a18bccbe46bda1c}`;
  
      // Fetch data from the OpenWeatherMap API
      const response = await axios.get(api);
      console.log("called", response.data);
  
      
      res.json({ });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  


app.post("/updateUserData", async(req, res) => {
    const{ email, loginTime, loginDate } = req.body;
    console.log(req.body);
    console.log("i am calling ")

    
        try {
            // Find the user data based on the email
            const userData = await UserDataModel.findOne({ email });
    
            if (!userData) {
                res.status(404).json({ message: 'User data not found' });
                return;
            }
    
            // Update login count
            userData.data.loginCount++;
    
            // Check if it's a new day, and if so, reset the per day login count
            if (loginDate in userData.data.loginCountPerDay[0] ) {
                console.log("Date already present")
                userData.data.loginCountPerDay[0][loginDate]++;
            } else {
                userData.data.loginCountPerDay[0][loginDate] = 1;
                console.log("date is not present")
                console.log(userData.data.loginCountPerDay[0])
            }

            
            
            // Check if the date exists in loginTime, and add the time to the list
            if (userData.data.loginTime[0][loginDate]) {
                userData.data.loginTime[0][loginDate].push(loginTime);
                console.log("i am");
            } else {
                userData.data.loginTime[0][loginDate] = [loginTime];
            }

           

           if (!userData.data.loginDates.includes(loginDate)) {
                console.log(loginDate);
                console.log("Date is not present");
                userData.data.loginDates.push(loginDate);
                console.log("date is added to login date succecssfully");

             }


            userData.markModified('data.loginCountPerDay');

            userData.markModified('data.loginDates');

            userData.markModified('data.loginTime');
    

            // Save the updated user data
            await userData.save();
    
            // Format the data as per your desired output
            // const formattedData = {
            //     email: userData.email,
            //     loginTime: userData.data.loginTime,
            //     loginDate: userData.data.loginDates.join(' '), // Join dates if multiple
            //     loginCount: userData.data.loginCount,
            //     perDayLoginCount: userData.data.loginCountPerDay,
            //     IPaddress: userData.data.IPaddress,
            // };
    
            //res.json(formattedData);
        } catch (error) {
            console.error('Error updating user data:', error);
            res.status(500).json({ error: 'An error occurred while updating data' });
        }
    });


    
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


    
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    UserModel.findOne({ email: email })
        .then(user => {
            if (user) {
                bcrypt.compare(password, user.password, (err, response) => {
                    if (response) {
                        console.log(response.data);
                        const token = jwt.sign({ email: user.email, role: user.role }, "jwt-secret-key", { expiresIn: '1d' })
                        res.cookie('token', token)
                        return res.json({ Status: "Success", role: user.role })
                    } else {
                        return res.json({ Status: "The password is invalid" });
                    }
                })
            } else {
                return res.json("No records exist")
            }
        })
});

app.listen(3002, () => {
    console.log("Server is running on port 3002");
});