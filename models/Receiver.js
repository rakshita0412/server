const mongoose = require('mongoose')

const ReceiverSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: String,
        default: "visitor"
    }
})

const ReceiverModel = mongoose.model("receivers", ReceiverSchema)
module.exports = ReceiverModel