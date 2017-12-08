require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const https = require('https');
const WebSocket = require('ws');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// websockets for group comms
const wss = new WebSocket.Server({ port: 10102 });

var ourData = {
  type: 'dataFromServer',
  tickers: [],
};

wss.on('connection', function connection(ws) {
  console.log("ws.on(connection) someone connected");
  if (ourData.tickers.length) {
    ws.send(JSON.stringify(ourData));
  }
  ws.on('message', function incoming(message) {
    handleMessage(message, function(err) {
      if (err) console.log(err);
      else wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(ourData));
        }
      })
    });
  });

  function getTickerData(ticker, cb) {
    const quandl = 'https://www.quandl.com/api/v3/datasets/WIKI/' +
      ticker + '.json?start_date=2016-01-01&end_date=2016-12-31' +
      '&order=asc&column_index=4&collapse=weekly&api_key=' +
      process.env.QUANDL_KEY;

    https.get(quandl, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        body = JSON.parse(body);
        //console.log(body);
        if (body.hasOwnProperty('dataset')) {
          cb(false, body.dataset);
        } else {
          cb({error: 'not_valid_ticker'});
        }
      });
    });
  }

  function handleMessage(m,cb) {
    const j = JSON.parse(m);
    if (j.action === 'add') {
      addTicker(j.ticker, cb);
    } else if (j.action === 'rm') {
      removeTicker(j.ticker, cb);
    }
  }

  function addTicker(t, cb) {
    getTickerData(t, function(err, data) {
      if (err) cb(err);
      else {
        ourData.tickers.push(data);
        cb(false);
      }
    })
  }

  function removeTicker(t, cb) {

    var idx = ourData.tickers.findIndex(function(e) {
      return e.dataset_code === t
    })


    ourData.tickers.splice(idx,1);
    //cb('noop ' + t + ' ' + idx);
    cb(false);
  }

});
