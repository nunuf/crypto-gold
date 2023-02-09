"use strict";
/// <reference path="jquery-3.6.0.js" />

// Document Ready
$(() => {

  /* ----- SPA ----- */

  $('section').hide();
  $('#homeSection').show();

  $('a').on('click', function () {
    const dataSection = $(this).attr('data-section');
    $('section').hide();
    $('#' + dataSection).show();
  });

  /* ----- AJAX ----- */

  const getJSON = (url) => {
    return new Promise((resolve, reject) => {
      $.ajax({
        url,
        success: data => {
          resolve(data);
        },
        error: err => {
          reject(err);
        }
      });
    });
  };

  /* ----- Local Storage ----- */

  // Save to localStorage
  const saveToLocalStorage = (key, data) => {
    const value = JSON.stringify(data);
    localStorage.setItem(key, value);
  };

  // Get from localStorage
  const getFromLocalStorage = (key) => {
    const value = localStorage.getItem(key);
    return JSON.parse(value);
  };

  // Delete from localStorage
  const deleteFromLocalStorage = (key) => {
    localStorage.removeItem(key);
  };

  /* ----- Common ----- */

  // Show loader
  const showLoader = (div, loaderClass) => {
    $(div).addClass(loaderClass);
  };

  // Hide loader
  const hideLoader = (div, loaderClass) => {
    $(div).removeClass(loaderClass);
  };

  // Audio player
  const play = (index) => {
    $('audio').get(0).pause();
    $('audio').get(1).pause();
    $('audio').get(2).pause();
    $('audio').get(3).pause();
    $('audio').get(index).play();
  };

  /* ----- Home tab ----- */

  // Home tab click event handler
  $('#home').on('click', function () {
    play(1);
  });

  /* ----- Search ----- */
  // Search click event
  $('.search-btn').on('click', function () {
    search();
  });
  
  // Search Enter and X event
  $('input[type=search]').on('search', function () {
    search();
  });
  
  // Search handler
  const search = () => {
    let coins = getFromLocalStorage('coins');
    const textToSearch = $('input[type=search]').val().toLowerCase();
    if (textToSearch === '') {
      displayCoins('coins', coins);
    } else {
      const filteredCoins = coins.filter(c => c.symbol === textToSearch);
      if (filteredCoins.length > 0) {
        displayCoins('coins', filteredCoins);
      } else {
        $('#coins').html('<h1>No coins found</h1>');
        $('input[type=search]').val('');
      }
    }
  };
  /* ------------------ */

  // Get and display coins
  const handleCoins = async () => {
    try {
      const coins = await getJSON('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true');
      saveToLocalStorage('coins', coins);
      displayCoins('coins', coins);
      deleteFromLocalStorage('selectedCoins');
    }
    catch (err) {
      alert(err.message);
    }
  };
  handleCoins();

  // Display coins
  const displayCoins = (divName, coins) => {
    let content = '';
    for (const coin of coins) {
      const card = createCard(coin, divName === 'selectedCoins');
      content += card;
    }
    $(`#${divName}`).html(content);
  };

  // Create card dynamically
  const createCard = (coin, isModal) => {
    const card = `
      <div class="card">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" role="switch" id="${coin.id}" ${isModal ? 'checked' : ''}>
        </div>
        <div>${coin.symbol}</div>
        <div class="fs-5">${coin.name}</div>
        <div><img src="${coin.image}" alt=""/></div>
        <button class="btn" data-id="${coin.id}" data-bs-toggle="collapse" data-bs-target="#collapse${coin.id}" aria-expanded="false">More Info</button>
        <div class="collapse" id="collapse${coin.id}">
          <div></div>
        </div>
      </div>
    `;
    return card;
  };

  // More Info button click event handler
  $('#homeSection').on('click', '.card > button', async function () {
    play(0);
    const coinId = $(this).attr('data-id');
    const dataDiv = $(this).next().children()[0];
    showLoader(dataDiv, 'loader');
    let moreInfo = getFromLocalStorage(coinId);
    if (!moreInfo) {
      moreInfo = await getMoreInfo(coinId);
      saveToLocalStorage(coinId, moreInfo);
    }
    hideLoader(dataDiv, 'loader');
    if ($(dataDiv).children().length === 0) {
      displayMoreInfo($(dataDiv), moreInfo);
    } else {
      displayMoreInfo($(dataDiv), null);
    }
    setTimeout(() => {
      deleteFromLocalStorage(coinId);
      $(dataDiv).html('');
    }, 120000);
  });

  // Display More Info content dynamically
  const displayMoreInfo = (div, moreInfo) => {
    let content = '';
    if (moreInfo) {
      content = `
        $${moreInfo.market_data.current_price.usd}<br/>
        €${moreInfo.market_data.current_price.eur}<br>
        ₪${moreInfo.market_data.current_price.ils}
      `;
    }
    $(div).html(content);
  };

  // Get More Info data
  const getMoreInfo = async (coinId) => {
    try {
      return await getJSON(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    }
    catch (err) {
      alert(err.message);
    }
  };

  // Toggle switch event handler
  $('#homeSection').on("click", '.form-switch > input', async function () {
    const coinId = $(this).attr('id');
    const coin = await getCoin(coinId);
    let selectedCoins = getFromLocalStorage('selectedCoins');

    if (!selectedCoins) {
      selectedCoins = [];
    }

    if ($(this).filter(':checked').val()) {
      selectedCoins.push(coin);
      saveToLocalStorage('selectedCoins', selectedCoins);
      if (selectedCoins.length > 5) {
        $('#modal').modal('show');
        $('#modal').attr('data-id', coin.id);
        $('#modal').attr('data-symbol', coin.symbol);
      }
    } else {
      if (selectedCoins.length > 5) {
        $('#modal').attr('data-id', coin.id);
        $('#modal').attr('data-symbol', coin.symbol);
        $('#modal').modal('hide');
      }
      selectedCoins = selectedCoins.filter(item => item.symbol !== coin.symbol);
      saveToLocalStorage('selectedCoins', selectedCoins);
    }
  });

  // Modal show event handler
  $('#modal').on('show.bs.modal', function () {
    const selectedCoins = getFromLocalStorage('selectedCoins');
    displayCoins('selectedCoins', selectedCoins);
  });

  // Modal hide event handler
  $('#modal').on('hide.bs.modal', function () {
    const coinId = $('#modal').attr('data-id');
    const coinSymbol = $('#modal').attr('data-symbol');
    let selectedCoins = getFromLocalStorage('selectedCoins');
    selectedCoins = selectedCoins.filter(item => item.symbol !== coinSymbol);
    saveToLocalStorage('selectedCoins', selectedCoins);
    $(`#${coinId}`).trigger('click');
  });

  // Get coin data
  const getCoin = async (coinId) => {
    try {
      return await getJSON(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    }
    catch (err) {
      alert(err.message);
    }
  };

  /* ----- Live Reports tab ----- */

  // Live Reports tab click event handler
  $('#liveDataReports').on('click', function () {
    play(2);
    displayLiveData();
  });
  
  // Display live data chart
  const displayLiveData = async () => {
    const selectedCoins = getFromLocalStorage('selectedCoins');
    if (selectedCoins && selectedCoins.length > 0) {
      $('#liveData').html('');
      displayChart(selectedCoins);
    } else {
      $('#liveData').html('<h1>No coins selected</h1>');
    }
  };

  // Create chart
  const displayChart = async (selectedCoins) => {
    showLoader('#liveData', 'tab-loader');
    let liveData = await getLiveData(selectedCoins.map(coin => coin.symbol).join(','));
    hideLoader('#liveData', 'tab-loader');
    const time = new Date;
    const name = Object.keys(liveData);
    const dataPoints = [];
    const data = [];

    for (let i = 0; i < selectedCoins.length; i++) {
      dataPoints[i] = [];

      data.push({
        type: "line",
        xValueType: "dateTime",
        yValueFormatString: "$###.00",
        xValueFormatString: "hh:mm:ss TT",
        showInLegend: true,
        name: name[i],
        dataPoints: dataPoints[i]
      });
    }

    // initial value
    let yValue = Object.values(liveData).map(item => item.USD);
   
    // toggle rendered data
    const toggleDataSeries = (e) => {
      if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
        e.dataSeries.visible = false;
      } else {
        e.dataSeries.visible = true;
      }
      e.chart.render();
    };

    const options = {
      title: {
        text: "Live Data"
      },
      axisX: {
        title: "Chart updates every 2 secs"
      },
      axisY: {
        prefix: "$",
        includeZero: false
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        verticalAlign: "top",
        fontSize: 22,
        fontColor: "dimGrey",
        itemclick: toggleDataSeries
      },
      data
    };

    // chart
    $("#liveData").CanvasJSChart(options);

    const updateInterval = 2000;

    const updateChart = async (count) => {
      count = count || 1;
      for (let i = 0; i < count; i++) {
        time.setTime(time.getTime() + updateInterval);

        liveData = await getLiveData(selectedCoins.map(coin => coin.symbol).join(','));

        // adding values
        yValue = Object.values(liveData).map(item => item.USD);

        for (let i = 0; i < selectedCoins.length; i++) {
          // pushing the new values
          dataPoints[i].push({
            x: time.getTime(),
            y: yValue[i]
          });
          // updating legend text with updated with y Value 
          options.data[i].legendText = `${name[i]} : $${yValue[i]}`;
        }
      }
      $("#liveData").CanvasJSChart().render();
    };

    // generates first set of dataPoints 
    updateChart(6);

    // updating chart every 2 secs
    setInterval(() => updateChart(), updateInterval);
  };
  
  // Get live data
  const getLiveData = async (coins) => {
    try {
      return await getJSON(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins}&tsyms=USD`);
    }
    catch (err) {
      alert(err.message);
    }
  };

  /* ----- About tab ----- */

  // About tab click event handler
  $('#about').on('click', function () {
    play(3);
    const birthday = new Date("10/08/1992");
    // calculate month difference from current date in time
    const month = Date.now() - birthday.getTime();
    // convert the calculated difference in date format
    const ageDiffDate = new Date(month); 
    // extract year from date    
    const year = ageDiffDate.getUTCFullYear();
    // calculate age
    const age = Math.abs(year - 1970);
    $('#age').html(age);
  });
});