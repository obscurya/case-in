const mongoose = require('mongoose');

const RequestSchema = mongoose.Schema({
  content: {
    type: String,
    require: true,
  },
  date: {
    type: String,
    require: true,
  },
  status: {
    type: String,
    require: true,
  },
  plan: {
    type: Array,
    require: true,
  },
});

const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;
