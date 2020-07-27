const mongoose = require('mongoose');

const MachineSchema = mongoose.Schema({
  id: {
    type: Number,
    require: true,
  },
  model: {
    type: String,
    require: true,
  },
  age: {
    type: Number,
    require: true,
  },
  components: {
    type: Array,
    require: true,
  },
  telemetry: {
    type: Object,
    require: true,
  },
  errors12h: {
    type: Array,
    require: true,
  },
});

const Machine = mongoose.model('Machine', MachineSchema);

module.exports = Machine;
