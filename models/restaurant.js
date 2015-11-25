var mongoose = require('mongoose');

var restaurantSchema = mongoose.Schema({
    address : {
        street: String,
        zipcode: String,
        building: String,
        coord: [Number,Number]
        },
    borough: String,
    cuisine: String,
    grades: [{date: String, grade: String, score: Number}],
    name: String,
    restaurant_id: String
});

module.exports = restaurantSchema;
