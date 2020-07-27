const Machine = require('../models/Machine');

module.exports = {
  get: async (req, res, next) => {
    const machines = await Machine.find();

    res.json(machines);
  },
};
