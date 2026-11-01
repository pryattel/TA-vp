const express = require('express');
const router = express.Router ();

//kontrollerid
const{
	eestifilm,
	inimesed,
	inimesedAdd,
	inimesedAddPost,
	filmid,
	filmiAdd,
	regvisit,
	lastvisit} = require('../controllers/eestifilmControllers');

router.route('/').get(eestifilm);

router.route('/inimesed').get(inimesed);

router.route('/inimesed_add').get(inimesedAdd);

router.route('/inimesed_add').post(inimesedAddPost);

router.route('/eestifilmfilmid').get(filmid);

router.route('/eestifilmfilmid_add').get(filmiAdd);

router.route('/regvisit').get(regvisit);

router.route('/lastvisit').get(lastvisit);

module.exports = router;