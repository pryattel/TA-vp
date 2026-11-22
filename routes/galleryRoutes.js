const express = require('express');
const router = express.Router();

const checkLogin = require('../src/checkLogin');
router.use(checkLogin.isLogin);

//kontrollerid
const {gallery} = require('../controllers/galleryControllers');

router.route('/').get(gallery);

module.exports = router;