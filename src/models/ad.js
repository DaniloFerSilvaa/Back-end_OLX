const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const modelSchema = new mongoose.Schema({
     idUser: String,
     state: String,
     category: String,
     images: [Object],
     dateCreate: Date,
     title: String,
     price: Number,
     priceNegotiable: Boolean,
     description: String,
     viewes: Number,
     status: String
});

const modelName = 'Ad';

if (mongoose.connection && mongoose.connection.models[modelName]) {
     module.exports = mongoose.connection.models[modelName];
} else {
     module.exports = mongoose.model(modelName, modelSchema)
}

/*
- _id
- idUser
- state
- category
- images[ {url, defalt: true} ]
- dateCreate
- title
-price
- priceNegotiable: true
- description
- views
- status
*/