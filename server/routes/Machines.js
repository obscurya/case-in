const router = require('express-promise-router')();

const MachinesController = require('../controllers/Machines');

router.route('/').get(MachinesController.get);

module.exports = router;
