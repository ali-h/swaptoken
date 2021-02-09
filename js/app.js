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
