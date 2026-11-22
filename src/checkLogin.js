exports.isLogin = function(req, res, next){
	if(req.session != null){
		if(req.session.userid){
			console.log ('Sisseloginud kasutaja :' + req.session.userid);
			next();
		} else {
			console.log ('Pole sisseloginud, pole sessioonimuutujat!');
			return res.redirect('/signin');
		}
	} else {
		console.log ('Sessiooni pole!');
		return res.redirect('/signin');
	}
}