const mongoose = require("mongoose");

const connection = async() =>{
     try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log( `Database Connected Successfully host:- ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error: ${error}`);
    }
}

module.exports = connection;