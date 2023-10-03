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
            email,
            data: {
                
                loginDates:[] ,
                loginTime: [{}],
                loginCount: 0,
                loginCountPerDay: [{}],
                Location:[{}]
                
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
  


app.post('/getapi', async(req, res) => {
    try {
      const { api } = req.body;
      console.log(api)
  
    if(api){
      const response = await axios.get(api);

    //   console.log("called", response.data);
      res.json({success: true, city: response.data.name  });
  
    }
    } catch (error) {
    //   console.error('Error fetching data:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });
  


  app.post('/trackClicks', (req, res) => {
    console.log("button click")
    const clickCount = req.body.clickCount;
    console.log(`Received click count from client: ${clickCount}`);

    res.status(200).send('Click count received successfully.');
  });
  
  


app.post("/updateUserData", async(req, res) => {
    const{ email, loginTime, loginDate, location } = req.body;
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
            //userData.data.IPaddress = ipAddress;
            //userData.data.location = location;
    
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
                console.log("Date not present");
                userData.data.loginDates.push(loginDate);
                console.log("date is added to login date succecssfully");
             }



            userData.markModified('data.loginCountPerDay');

            userData.markModified('data.loginDates');

            userData.markModified('data.loginTime');
            

            if (userData.data.Location[0][loginDate]) {
                userData.data.Location[0][loginDate].push(location);
                console.log("i am");
            } else {
                userData.data.Location[0][loginDate] = [location];
            }

            userData.markModified('data.Location');



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



app.post('/getUserData', async(req, res) => {
    console.log(req.body)
    // res.json({'msg':'iconnected'})
    try {
        const { email } = req.body;
        
        // Find the user data based on the provided email
        const userData = await getUserDataByEmail(email);

        if (!userData) {
            return res.status(404).json({ message: 'User data not found' });
        }
        const formattedUserData = {
            email: userData.email,
            loginDates: userData.data.loginDates,
            loginTime: userData.data.loginTime,
            loginCount: userData.data.loginCount,
            loginCountPerDay: userData.data.loginCountPerDay,
            Location: userData.data.Location,
        };

        // Send the formatted user data as the response
        res.json({ success: true, userData: formattedUserData });
    } catch (error) {
        console.error('Error fetching user data by email:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});   


    
app.post('/register',(req, res) => {
    // console.log("i am called")
    const {name, email, password} = req.body;
    // console.log(name, email, password)
    bcrypt.hash(password, 10)
    .then(hash => {
        console.log("i am here")
        
        UserModel.create({name, email, password: hash})
        .then(user => {
            res.json({status: "Success"});
                    // Create user data document after user registration
                    createUserData(email);
        })
        .catch(err => {
            console.log(err)
            res.json(err)
        })
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











// async function retrieveAndLogData() {
//     try {
//       // Connect to the MongoDB database
//       await mongoose.connect(dbURL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });
  
//       // Fetch all documents from the collection
//       const allData = await UserDataModel.find({});
  
//       // Log the retrieved data
//       console.log('All Data:', allData);
//     } catch (error) {
//       console.error('Error retrieving and logging data:', error);
//     } finally {
//       // Close the database connection
//       mongoose.connection.close();
//     }
//   }
  
//   // Call the function to retrieve and log the data
//   retrieveAndLogData();
  











app.listen(3002, () => {
    console.log("Server is running on port 3002");
});