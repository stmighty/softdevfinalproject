const mongoose = require('mongoose');

const connectDB = async () => {
    mongoose.set('strictQuery', true);                                              // ensures that values passed to our model constructor that were not specified in our schema do not get saved to the db
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`mongoDB Conneccted: ${conn.connection.host}`);
}
module.exports = connectDB;