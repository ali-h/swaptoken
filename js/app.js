const ACCOUNT = 'swaptoken';

$(window).bind('load', async () => {
  await refreshUser();
  await stateManage();
});

// login
$(document).on('keyup', '#login_username', function (e) {
  if (e.keyCode === 13) $('#login_button').click();
});

$(document).on('click', '#login_button', function () {
  const username = $('#login_username').val();

  if (!window.hive_keychain) toast('failure', 'Hive Keychain not installed');
  else {
    hive_keychain.requestSignBuffer(
      username,
      'Log In',
      'Posting',
      ( { error } ) => {

        if (error) {
          toast('failure', 'An error occured, please try again');
          return;
        }

        // put the logged in user in cache
        localStorage.setItem('user', username);
        location.reload();
      }
    );
  }
});

// logout
$(document).on('click', '#logout_button', function (e) {
  e.preventDefault();
  localStorage.clear();
  location.reload();
});

// page load
$(document).on('click', '.page_button', async function (e) {
  e.preventDefault();
  if (!$(this).attr("class").includes("active")) {
    const href = $(this).attr('href');
    await pushPage(href);
  }
});

$(document).on('click', '.pushBTN', async function(e) {
  e.preventDefault();
  const href = $(this).attr('href');
  await pushPage(href);
});

$(document).on('click', '#liquid_deposit', async function () {
  const res = await ssc.findOne('tokens', 'balances', {
    account: ACCOUNT,
    symbol: 'SWAP.HIVE'
  });

  let liquidity = '0';
  if (res) {
    liquidity = parseFloat(res.balance);
  }

  $('#liquid_d').text(`${n(liquidity)} SWAP.HIVE`);
});

$(document).on('click', '#deposit', function () {
  const quantity = $('#deposit_quantity').val();

  if (BigNumber(quantity).gte(0.002)) {
    if (!window.hive_keychain) toast('failure', 'Hive Keychain not installed');
    else {
      window.hive_keychain.requestTransfer(
        user,
        ACCOUNT,
        BigNumber(quantity).toFixed(3),
        '',
        'HIVE',
        function (response) {
          if (response.error) {
            toast('failure', 'An error occured, please try again');
            return;
          }

          toast('success', `Deposit successfull, please wait a few seconds before refreshing`);
          setTimeout(async function () {
            location.reload();
            return;
          }, 6000);
        },
        true
      );
    }
  }
});

$(document).on('click', '#withdraw', function () {
  const quantity = $('#withdraw_quantity').val();

  if (BigNumber(quantity).gte(0.002)) {
    const obj = {
      contractName: 'tokens',
      contractAction: 'transfer',
      contractPayload: {
        to: ACCOUNT,
        symbol: 'SWAP.HIVE',
        quantity: BigNumber(quantity).toFixed(8)
      }
    };

    if (!window.hive_keychain) toast('failure', 'Hive Keychain not installed');
    else {
      window.hive_keychain.requestCustomJson(
        user,
        'ssc-mainnet-hive',
        'active',
        JSON.stringify(obj),
        'Withdraw SWAP.HIVE',
        async function (response) {
          if (response.error) {
            toast('failure', 'An error occured, please try again');
            return;
          }

          toast('success', `Withdraw successfull`);
          await pushPage(location.href, response.result.id);
          return;
        }
      );
    }
  }
});
