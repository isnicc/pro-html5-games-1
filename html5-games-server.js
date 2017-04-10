/**
 * Pro HTML5 Games
 * Created by jefferson.wu on 04/09/17.
 */

// ========================
// MODULES ================
// ========================
const express           = require('express');
const app               = express();
const http              = require('http').Server(app);
const chalk             = require('chalk');
const clear             = require('clear');
const io                = require('socket.io')(http);

// =========================
// CONFIGURATION ===========
// =========================

const port              = process.env.PORT || 3000;
var connectedClients    = 0;

//------------------------
//--- enable socket.io ---
io.on('connection', function(socket){
    connectedClients++;
    console.log(chalk.blue(socket.id) + ' connected. Total: ' + connectedClients);
    io.emit('userCount', connectedClients);

    //SOCKET events here.
    socket.on('disconnect', function(){
        connectedClients--;
        console.log(chalk.red(socket.id) + ' disconnected. Total: ' + connectedClients);
        io.emit('userCount', connectedClients);
    });
});




// ====================
// MIDDLEWARE =========
// ====================


// --- basic logger ---
// TODO: switch to Morgan, or encapsulate into module
app.use(function(req,res,next){
    console.log(new Date() + ' ' + req.method + ' ' + req.url + ' ');
    next();
});

// ==================
// ROUTES ===========
// ==================



// TEMP ROUTES
app.get('/', function(req, res){
res.send('<b>You\'re on an active server.  Find the right page.</b>');
});

app.get('/promisevideo', function(req, res){
    promisedb.getFakeAsyncDataObject(2000).then(function(result){
        res.json(result);

    }).catch(function(reason){
        res.json(reason);
    });
});

app.get('/:page', function(req, res){
    res.sendFile(process.cwd() + '/public/' + req.params.page + '.html');
    console.log(chalk.yellow('sending file ' + req.params.page + '.html'));
});


// ========================
// CATCH ALL MIDDLEWARE ===
// ========================
//static files
app.use(express.static('public/'));

// 404
app.use(function(req,res,next){
    res.status(404);
    res.send('404: Page not found!');
});

// 500
app.use(function(req,res,next){
    res.status(500);
    res.render('500: Server error!');
});

// ========================
// ===== START SERVER =====
// ========================

http.listen(port, function(err){
    if(err) {
        console.log(Error('Error: ' + err));
    } else {
        clear();
        console.log(chalk.blue('Canvas Core on port ' + port));
    }
});