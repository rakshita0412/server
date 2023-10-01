const mongoose = require('mongoose');



const userDataSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    }
    ,
    data: {
        loginDates: [{
            type: String,
        }],
        loginCount: {
            type: Number,
            default: 0,
        },
        loginTime: {
            type: Object,
            default: {},
        },
        loginCountPerDay: {
            type: Object,
            default: {},
        },
        IPaddress: {
            type: Object,
            default: {},
        }
        // You can add more subfields here as needed
    }
});


const UserDataModel = mongoose.model('UserData', userDataSchema);

module.exports = UserDataModel;
 