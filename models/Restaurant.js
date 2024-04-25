const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please add a name'],
        unique: true,
        trim: true,
        maxlength:[50, 'Name cannot be more than 50 characters']
    },

    address:{
        type: String, 
        required: [true, 'please add an address']
    },

    tel: {
        type: String
    },

    opentime: {
        type: String,
        required: [true, 'please add an opening time']
    },

    closetime: {
        type: String,
        required: [true, 'please add a closing time']
    },

    capacity: {
        type: Number,
    },

    price: {
        type: Number,
        required: [true, 'please add a price']
    },
},

{
    toJSON: {virtuals : true},
    toObject: {virtuals: true}
});


//reverse populate with virtual
RestaurantSchema.virtual('appointments', {
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'restaurant',
    justOne: false
});


//Casecade delete appointments when a restaurant is deleted
RestaurantSchema.pre('deleteOne', {document: true, query: false}, async function(next) {
    console.log(`Appointments being removed from restaurant ${this._id}`);
    await this.model(`Appointment`).deleteMany({restaurant: this._id});
    next();
});



module.exports = mongoose.model('Restaurant', RestaurantSchema);