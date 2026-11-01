const dateTimeET = require('../src/dateTimeET.js');
const fs = require('fs').promises
const regvisit =(req, res)=>{
    res.render('regvisit')
}

const regvisitPost = async (req, res)=>{
    console.log(req.body)
    try {
        await fs.open(regTextRef, 'a')
        await fs.appendFile(regTextRef, req.body.nameInput + ';' + dateTimeET.dateET() + ';' + dateTimeET.timeET() + ';' + dateTimeET.weekDayET() + '\n')
        res.render('regvisit')
    } catch (err) {
        console.log(err)
        res.render('regvisit')
    }
}

module.exports = {
    regvisit,
    regvisitPost
}