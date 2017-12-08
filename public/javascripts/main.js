(function() {
  console.log('main.js start');
  var ws = new WebSocket('ws://localhost:10102');
  var inputDom = document.getElementById('ticker-input');
  var tickersDom = document.getElementById('tickers');

  ws.onopen = function() {
    //web socket connected
    console.log('connected');
  };

  ws.onmessage = function(e) {
    var json = JSON.parse(e.data);
    console.log('ws.onmessage start');
    console.log(json);
    console.log('ws.onmessage end');
    updateTickers(json.tickers);
  };

  ws.onclose = function(e) {
    console.log("socket closed");
    console.log(e);
  };

  inputDom.onchange = function (d) {
    console.log(d.target.value);
    ws.send(JSON.stringify({
      action: 'add',
      ticker: d.target.value
    }));
  };

  function updateTickers(a) {
    emptyDom(tickersDom);
    addList(tickersDom, a);
    drawSvg(a);
  }

  function emptyDom(dom) {
    while (dom.firstChild)
      dom.removeChild(dom.firstChild);
  }

  function addList(dom, a) {
    pdiv = document.createElement('div');
    dom.appendChild(pdiv);
    a.forEach(function(val,idx,arr) {
      var name = val.name;
      i = name.indexOf('(');
      if (i) {
        name = name.substring(0,i);
      }
      cdiv = document.createElement('div');
      cdiv.className = 'ticker-list'
      cdiv.innerHTML = val.dataset_code + ' [ ' + name + ' ]';
      s = document.createElement('span');
      s.className = 'ticker-remove-item';
      s.title = 'remove ' + name;
      s.id = 'remove#' + val.dataset_code;
      s.innerHTML = 'x';
      s.onclick = removeTicker;
      cdiv.appendChild(s);
      pdiv.appendChild(cdiv);
    })
  }

  function removeTicker(e) {
    const ticker = e.target.id.split('#')[1];
    console.log(ticker);
    ws.send(JSON.stringify({
      action: 'rm',
      ticker: ticker
    }));
  }

  function drawSvg(data) {
    // remove any children in #main-chart
    emptyDom(document.getElementById('main-chart'));

    var svg = dimple.newSvg("#main-chart", 500, 360);
    d3data = transformData(data);
    //data = dimple.filterData(data, "Owner", ["Aperture", "Black Mesa"])
    var myChart = new dimple.chart(svg, d3data.data);
    //myChart.setBounds(60, 30, 505, 305);
    var x = myChart.addCategoryAxis("x", "briefDate");
    x.addOrderRule("briefDate");

    myChart.addMeasureAxis("y", "price");

    myChart.addSeries('ticker', dimple.plot.line);

    myChart.addLegend(60, 10, 500, 20, "left");
    myChart.draw();

  }

  function transformData(d) {
    var e = [];
    var tickers = [];
    d.forEach(function(v1,i1,a1) {
      tickers.push(v1.dataset_code);
      v1.data.forEach(function(v2,i2,a2) {
        e.push({
          ticker: v1.dataset_code,
          date: v2[0],
          price: v2[1],
          briefDate: getBriefDate(v2[0])
        })
      })
    })
    console.log(e);
    return {
      tickers: tickers,
      data: e
    }
  }

  function getBriefDate(d) {
    const t = d.split('-');
    var text;
    switch(t[1]) {
      case '01':
        text = 'Jan';break;
      case '02':
        text = 'Feb';break;
      case '03':
        text = 'Mar';break;
      case '04':
        text = 'Apr';break;
      case '05':
        text = 'May';break;
      case '06':
        text = 'Jun';break;
      case '07':
        text = 'Jul';break;
      case '08':
        text = 'Aug';break;
      case '09':
        text = 'Sep';break;
      case '10':
        text = 'Oct';break;
      case '11':
        text = 'Nov';break;
      case '12':
        text = 'Dec';break;
    }
    return text + ' ' + t[0];
  }
  console.log("main.js done")

})();
