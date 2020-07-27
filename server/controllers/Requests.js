const Request = require('../models/Request');

module.exports = {
  get: async (req, res, next) => {
    const requests = await Request.find();

    res.json(requests);
  },

  add: async (req, res, next) => {
    let request = req.body;

    await Request.create(request);

    res.json(request);
  },

  update: async (req, res, next) => {
    const request = req.body;

    await Request.findOneAndUpdate({ _id: request._id }, request);

    res.json(request);
  },
};
