let toast_id = 0;
let user = null;
const only_login_pages = ['wallet'];
const no_access_pages = ['unauthorized'];
const ssc = new SSC('https://api.hive-engine.com/rpc');

const isLoggedIn = function () {
  const user = localStorage.getItem('user');
  if (user) return true;
  else return false;
}

// gets complete table from the hive-engine rpc
const getData = async function (contract, table, query = {}, index = null) {
  const dataFinal = [];
  let offset = 0;
  let isPending = true;

  while (isPending) {
    const data = await ssc.find(
      contract,
      table,
      query,
      1000,
      offset,
      [index ? index : { index: '_id', descending: false }],
    );

    dataFinal.push(...data);
    // if the result is less than 1000, means there is no further data in table
    if (data.length !== 1000) {
      isPending = false;
      return dataFinal;
    } else offset += 1000;
  }
};

const getHivePrice = async function () {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=HIVE&vs_currencies=USD');
  return response.data.hive.usd;
};

// to have numbers in a format i.e 1,000,000
function n(x) {
  if (x === '0.000') x = '0';
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

window.addEventListener('popstate', async function (e) {
  await stateManage();
});

const load = async function (pageName) {
  // jquery GET
  $.get(`../views/${pageName}.html`, function (data) {
    const page = data;
    $('#app').html(page);
    $('#loading').addClass('d-none');
    $('#app').removeClass('d-none');
  }).fail(function() {
    $.get(`../views/404.html`, function (data) {
      const page = data;
      $('#app').html(page);
      $('#loading').addClass('d-none');
      $('#app').removeClass('d-none');
    });
  });
}

const loadPage = async function (pageName) {
  $('.nav-link').each(function () {
    $(this).removeClass('active');
  });

  $(`.nav-link[href='?p=${pageName}']`).addClass('active');

  if (only_login_pages.includes(pageName) && !isLoggedIn()) {
    load('unauthorized');
  } else if (no_access_pages.includes(pageName)) {
    load('404');
  } else {
    load(pageName);
  }
}

const stateManage = async function () {
  const url = new URL(location.href);
  const requested_page = url.searchParams.get('p');

  // check if a page is requested in the URL, if not load the tokens page (default)
  if (requested_page) {
    await loadPage(requested_page);
  } else {
    history.pushState({}, document.title, `?p=tokens`);
    await loadPage('tokens');
  }
}

const pushURL = function (href) {
  history.pushState({}, document.title, href);
}

// if the user is logges in, remove the login button
const refreshUser = async function () {
  user = localStorage.getItem('user');

  if (user) {
    // get the users utility balance
    let balance = '0 SWAP.HIVE'
    const res = await ssc.findOne('tokens', 'balances', {
      account: user,
      symbol: 'SWAP.HIVE'
    });
    if (res) balance = `${n(res.balance)} SWAP.HIVE`;
    $("#user_balance").text(balance);

    $('#login_nav').addClass('d-none');
    $('#userNav').text(`@${user}`);
    $('.logged_in').each(function () {
      $(this).removeClass('logged_in');
    });
  }
}

// pushes the page into the URL without refreshing
const pushPage = async function (href, id = null) {
  $('#loading').removeClass('d-none');
  $('#app').addClass('d-none');

  let result = null;
  if (id) {
    do {
      result = await ssc.getTransactionInfo(id);
    } while (result === null);
  }

  history.pushState({}, document.title, href);
  refreshUser();
  await stateManage();
}

// to toast a success, failure, warning message
const toast = function (type, message) {
  const el_toast = $(`
    <div id="toast${toast_id}" class="toast dark" data-delay="1800">
      <div class="toast-body align-middle">
        ${
          (type === 'success') ? `
            <svg width="1.5em" height="1.5em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path fill-rule="evenodd" d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.236.236 0 0 1 .02-.022z"/>
            </svg>
          ` : (type === 'failure') ? `
            <svg width="1.5em" height="1.5em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path fill-rule="evenodd" d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          ` : (type === 'warning') ? `
            <svg width="1.5em" height="1.5em" viewBox="0 0 16 16" class="bi bi-exclamation-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
          ` : ''
        }
        <span class="align-middle ml-2">${message}</span>
      </div>
    </div>
  `);

  $('#toast_area').append(el_toast);
  $(`#toast${toast_id}`).toast('show');

  // when toast is hidden, delete it from the body
  $(`#toast${toast_id}`).on('hidden.bs.toast', function () {
    $(this).remove();
  });

  toast_id++;
}
