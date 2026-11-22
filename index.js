const express = require('express');
const fs = require('fs').promises;
//moodul URL-i lahtiharutamiseks, et saaks POST osad ka kätte
const bodyparser = require('body-parser');
const mysql = require('mysql2/promise');
//moodul .env faili lugemiseks, keskkonnamuutujate parsimiseks
require('dotenv').config();
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const checkLogin = require('./src/checkLogin');
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

//käivitan expess.js funktsiooni ja annan nimeks "app"
const app = express();
//võtan kasutusele sessiooni
/* app.use(session({
	secret: process.env.SES_SECRET,
	saveUninitialiszed: false,
	resave: false
}));
 */
 const sessionStore = new MySQLStore({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME
	});
app.use(session({
	secret: process.env.SES_SECRET,
	store: sessionStore,
	saveUninitialized: false,
	resave: false,
	cookie: {
		maxAge: 1000 * 50 * 50 * 1 //sessiooni küpsiste aegumisaeg
	}
}));
// Kasutaja info kõikidele vaadetele
app.use((req, res, next) => {
    res.locals.userid = req.session.userid || null;
    next();
});


//määrame veebilehtedele mallide renderdamise mootori
app.set('view engine', 'ejs');
//määran ühe päris kataloogi virtuaalses serveris kättesaadavaks
app.use(express.static('public'));
//app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.urlencoded({extended: true}));//kui vormidest ainult tekst, siis "false"

//marsruudid
//app.get('/', (req, res)=>{
	app.get('/', async (req, res)=>{
	//res.send('Express.js läks käima ja serveerib meile veebi.');
	const dayNow = dateET.day();
	const dateNow = dateET.fullDate(0);
	const timeNow = dateET.fullTime();
	//vaikimisi väärtused, kui fotot ei leita
	let photoFile = '/pic/avaleht.jpg';
	let photoAlt = 'Avalehe foto';
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_NAME
		});
		const sqlReq = 'SELECT filename, alttext FROM galleryphotos WHERE id=(SELECT MAX(id) FROM galleryphotos WHERE privacy=? AND deleted IS NULL)';
		const [sqlRes] = await conn.execute(sqlReq, [3]);
		if(sqlRes.length > 0){
			photoFile = '/gallery/normal/' + sqlRes[0].filename;
			//kui alternatiivteksti pole, mõtleme ise
			if(sqlRes[0].alttext){
				photoAlt = sqlRes[0].alttext;
			} else {
				photoAlt = 'Uusim avalik foto';
			}
		}
	}
	catch (err) {
		console.log('Viga: ' + err);
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
	res.render('index', {dayNow: dayNow, dateNow: dateNow, timeNow: timeNow, photoFile: photoFile, photoAlt: photoAlt});
});

//sisseloginud kasutajate avaleht
app.get('/home', checkLogin.isLogin, (req, res)=>{
	res.render('home');
	});
	
//väljaloginud kasutajate avaleht
app.get('/logout', (req, res)=>{
	req.session.destroy((err) => {
		if(err) {
			console.log('Viga sessiooni lõpetamisel: ' + err);
			return res.redirect('/home');
		}
		
		res.clearCookie('connect.sid');
		res.redirect('/');
		});
	});

app.get('/vanasona', async (req, res)=>{
	console.log('Päringu sisu on: ' + req.body);
	try {
		const data = await fs.readFile(textRef, "utf8");
		let folkWisdom = data.split(";");
		res.render('vanasona', {wisdom: folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))]});
	}
	catch (err) {
		console.log(err);
		res.render('vanasona', {wisdom: 'Ei leidnud ühtegi vanasõna!'});
	}
});

app.get('/tlu', async (req, res)=>{
	res.render('tlu');
	});

app.get('/regvisit', (req, res)=>{
	res.render('regvisit');
});

/* app.post('/regvisit', async (req, res)=>{
	console.log(req.body);
	try {
		  //await fs.open(regTextRef, 'a');
		  const dateNow = dateET.fullDate(0);
		  const timeNow = dateET.fullTime();
		  await fs.appendFile(
		    regTextRef,
			req.body.nameInput + ', ' + dateNow + ', ' + timeNow + '\n');
		  //await fs.appendFile(regTextRef, req.body.nameInput + ';');
		  res.render('regvisit');
	}
	catch (err){
		console.log(err);
		res.render('regvisit');
	}
});  */

/* app.get('/lastvisit', async (req, res) => {
    try {
        const data = await fs.readFile(regTextRef, 'utf8');
        let visits = data.split('\n');
        let lastVisit = visits[visits.length - 2];
        let visitData = lastVisit.split(',');

        let name = visitData[0];
        let date = visitData[1];
        let time = visitData[2];

       res.render('lastvisit', {
           date: date,
           time: time,
           name: name
        });
    }
	catch (err) {
        console.log(err);
        res.send('Külastuste lugemisel tekkis viga!');
    }
}); */


/* app.get('/eestifilm', (req,res)=>{
	res.render('eestifilm');
}); */

/* app.get('/eestifilmiinimesed', async (req,res)=>{
	//console.log('Andmebaasiserver on: ' + process.env.DB_HOST);
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: 'if26_polina_rattel_TA'
		});
		const sqlReq = 'SELECT * FROM person ORDER by last_name';
		const [sqlRes] = await conn.execute(sqlReq);
		console.log(sqlRes);
		res.render('eestifilmiinimesed', {personList: sqlRes});
	}
	catch (err){
		console.log('Viga andmebaasist lugemisel: ' + err);
		res.render('eestifilmiinimesed', {personList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
}); */

/* app.get('/eestifilmiinimesed_add', (req, res) => {
    res.render('eestifilmiinimesed_add', {
        notice: 'Ootan sisestust!',
        firstNameInput: null,
        lastNameInput: null,
        bornInput: null,
        deceasedInput: null
    });
}); */

/* app.post('/eestifilmiinimesed_add', async (req, res) => {
    console.log(req.body);

    const now = new Date();
    const bornDate = new Date(req.body.bornInput);

    let deceasedDate = null;
    let errorMessage = '';

    //eesnime ja perekonnanime kontroll
    if (!req.body.firstNameInput || !req.body.lastNameInput) {
        errorMessage = 'Palun sisesta eesnimi ja perekonnanimi!';
    }
    //sünnikuupäeva kontroll
    else if (
        !req.body.bornInput ||
        isNaN(bornDate.getTime()) ||
        bornDate > now
    ) {
        errorMessage = 'Sünnikuupäev pole korrektne!';
    }
    //surmakuupäeva kontroll
    else if (req.body.deceasedInput !== '') {
        deceasedDate = new Date(req.body.deceasedInput);

        if (
            isNaN(deceasedDate.getTime()) ||
            deceasedDate > now ||
            deceasedDate < bornDate
        ) {
            errorMessage = 'Surmakuupäev pole korrektne!';
        }
    }

    if (errorMessage !== '') {
        return res.render('eestifilmiinimesed_add', {
            notice: errorMessage,
            firstNameInput: req.body.firstNameInput,
            lastNameInput: req.body.lastNameInput,
            bornInput: req.body.bornInput,
            deceasedInput: req.body.deceasedInput
        });
    }

    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: 'if26_polina_rattel_TA'
        });

        const sqlReq =
            'INSERT INTO person (first_name, last_name, born, deceased) VALUES (?,?,?,?)';

        await conn.execute(sqlReq, [
            req.body.firstNameInput,
            req.body.lastNameInput,
            req.body.bornInput,
            req.body.deceasedInput || null
        ]);

        res.render('eestifilmiinimesed_add', {
            notice: 'Andmed salvestati! Ootan uut sisestust!',
            firstNameInput: null,
            lastNameInput: null,
            bornInput: null,
            deceasedInput: null
        });
    } catch (err) {
        console.log('Viga andmebaasiga suhtlemisel: ' + err);

        res.render('eestifilmiinimesed_add', {
            notice: 'Tekkis viga, andmeid ei salvestatud!',
            firstNameInput: req.body.firstNameInput,
            lastNameInput: req.body.lastNameInput,
            bornInput: req.body.bornInput,
            deceasedInput: req.body.deceasedInput
        });
    } finally {
        if (conn) {
            await conn.end();
        }
    }
}); */

/* app.get('/eestifilmfilmid_add', (req, res) => {
    res.render('eestifilmfilmid_add', {
        notice: 'Ootan sisestust!',
        titleInput: '',
        releaseYearInput: '',
        durationInput: '',
        descriptionInput: ''
    });
}); */

/* app.post('/eestifilmfilmid_add', async (req, res) => {
    const title = req.body.titleInput || '';
    const releaseYear = Number(req.body.releaseYearInput);
    const duration = Number(req.body.durationInput);
    const description = req.body.descriptionInput|| '';

    let notice = '';

    if (!title) {
        notice = 'Palun sisesta filmi pealkiri!';
    } else if (
        !req.body.releaseYearInput ||
        !Number.isInteger(releaseYear) ||
        releaseYear < 1888 ||
        releaseYear > new Date().getFullYear()
    ) {
        notice = 'Filmi ilmumisaasta pole korrektne!';
    } else if (
        !req.body.durationInput ||
        !Number.isInteger(duration) ||
        duration <= 0
    ) {
        notice = 'Filmi kestus pole korrektne!';
    }

    if (notice) {
        return res.render('eestifilmfilmid_add', {
            notice,
            titleInput: req.body.titleInput || '',
            releaseYearInput: req.body.releaseYearInput || '',
            durationInput: req.body.durationInput || '',
            descriptionInput: req.body.descriptionInput || ''
        });
    }

    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: 'if26_polina_rattel_TA'
        });

        await conn.execute(
            'INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?, ?, ?, ?)',
            [title, releaseYear, duration, description || null]
        );

        res.render('eestifilmfilmid_add', {
            notice: 'Film salvestati! Ootan uut sisestust!',
            titleInput: '',
            releaseYearInput: '',
            durationInput: '',
            descriptionInput: ''
        });
    } catch (err) {
        console.log('Viga filmi salvestamisel: ' + err);
        res.render('eestifilmfilmid_add', {
            notice: 'Tekkis viga, filmi ei salvestatud!',
            titleInput: req.body.titleInput || '',
            releaseYearInput: req.body.releaseYearInput || '',
            durationInput: req.body.durationInput || '',
            descriptionInput: req.body.descriptionInput || ''
        });
    } finally {
        if (conn) await conn.end();
    }
}); */

/* app.get('/eestifilmametid_add', (req, res) => {
    res.render('eestifilmametid_add', {
        notice: 'Ootan sisestust!',
        titleInput: '',
        descriptionInput: ''
    });
}); */

/* /* app.post('/eestifilmametid_add', async (req, res) => {
    let titleInput = req.body.titleInput;
    let descriptionInput = req.body.descriptionInput;

    if (!titleInput) {
        return res.render('eestifilmametid_add', {
            notice: 'Palun sisesta ameti nimetus!',
            titleInput: titleInput || '',
            descriptionInput: descriptionInput || ''
        });
    }

    let conn;

    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: 'if26_polina_rattel_TA'
        });

        const sqlReq =
            'INSERT INTO profession (title, description) VALUES (?, ?)';

        await conn.execute(sqlReq, [
            titleInput,
            descriptionInput || null
        ]);

        res.render('eestifilmametid_add', {
            notice: 'Amet salvestati! Ootan uut sisestust!',
            titleInput: '',
            descriptionInput: ''
        });
    } catch (err) {
        console.log('Viga ameti salvestamisel: ' + err);

        res.render('eestifilmametid_add', {
            notice: 'Tekkis viga, ametit ei salvestatud!',
            titleInput: titleInput || '',
            descriptionInput: descriptionInput || ''
        });
    } finally {
        if (conn) {
            await conn.end();
        }
    }
}); */ 

/* app.get('/seosed', async (req,res)=>{
	//console.log('Andmebaasiserver on: ' + process.env.DB_HOST);
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: 'if26_polina_rattel_TA'
		});
		const sqlReq = 'SELECT * FROM person ORDER by last_name';
		const [sqlRes] = await conn.execute(sqlReq);
		console.log(sqlRes);
		res.render('eestifilmiinimesed', {personList: sqlRes});
	}
	catch (err){
		console.log('Viga andmebaasist lugemisel: ' + err);
		res.render('eestifilmiinimesed', {personList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
}); */
//Eesti filmi marsruudid

const eestifilmRouter = require('./routes/eestifilmRoutes');
app.use('/eestifilm', eestifilmRouter);

const regvisitRouter = require('./routes/regvisitRoutes');
app.use('/regvisit', regvisitRouter);

const visitsRouter = require('./routes/visitsRoutes');
app.use('/visits', visitsRouter);

//galeriipiltide Ã¼leslaadimine
const galleryPhotoUploadRouter = require('./routes/galleryPhotoUploadRoutes');
app.use('/galleryPhotoUpload', galleryPhotoUploadRouter);

//fotogalerii
const galleryRouter = require('./routes/galleryRoutes');
app.use('/gallery', galleryRouter);

//kasutaja konto loomiseks marsruut
const signupRouter = require('./routes/signupRoutes');
app.use('/signup', signupRouter);

//Sisselogimise marsruut
const signinRouter = require('./routes/signinRoutes');
app.use('/signin', signinRouter);

app.listen(5124);