const mongoose = require("mongoose");

const connectDb = async () =>
{
    await mongoose.connect("mongodb+srv://govindsingh988877:SeCj8nCrPHpjw88U@bmw.yq6ggqm.mongodb.net/CoreTrack");
}

module.exports = connectDb;