const router = require('express-promise-router')();

const RequestsController = require('../controllers/Requests');

router.route('/').get(RequestsController.get);

router.route('/add').post(RequestsController.add);

router.route('/update').post(RequestsController.update);

module.exports = router;
