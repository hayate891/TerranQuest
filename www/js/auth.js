/*
 * Authentication and signup codez
 */

var authOpInProgress = false;

function askLogout() {
    navigator.notification.confirm(
            'Do you really want to logout?', // message
            function (btn) {
                if (btn === 1) {
                    logout();
                }
            },
            'Logout?',
            ['Logout', 'Cancel']
            );
}

function logout() {
    $.getJSON(mkApiUrl('deletesession', 'gs'), {}, function (data) {
        if (data.status === 'OK') {
            localStorage.setItem("username", '');
            localStorage.setItem("password", '');
            username = null;
            password = null;
            $('#content-zone').load("screens/login.html");
        } else {
            navigator.notification.alert("Server did not properly acknowledge logout.  You might have problems for the next few hours if you switch accounts.", null, "Error", 'Dismiss');
        }
    }).fail(function () {
        navigator.notification.alert("Cannot connect to authentication server.  Check your Internet connection and try again.  If that fails, clear the app data or reinstall TerranQuest.", null, "Error", 'Dismiss');
    });
}

function checkUserHasTeamOpenChooserIfNot(username) {
    $.getJSON(mkApiUrl('getstats', 'gs'), {
        user: username
    }, function (data) {
        if (data.status === 'OK' && data.stats.teamid !== null && data.stats.teamid > 0) {
            // We're all good.
            userteamid = data.stats.teamid;
            openscreen("home");
        } else {
            // Open the team intro thingy
            openscreen('chooseteam');
        }
    }).fail(function () {

    });
}

function dosignup() {
    if (authOpInProgress) {
        return;
    }
    authOpInProgress = true;
    $('#errorbase').hide();
    $('#signupBtn').html('<i class="fa fa-cog fa-spin fa-fw"></i> Please wait...');
    $('#signupBtn').attr('disabled', true);
    if ($('#usernameBox').val() === "") {
        $('#errormsg').text("Error:  Missing username.");
        $('#errorbase').css('display', 'block');
        $('#signupBtn').html('<i class="fa fa-user-plus"></i> Sign Up');
        $('#signupBtn').attr('disabled', false);
        return;
    }
    if ($('#passwordBox').val() !== $('#passwordBox2').val()) {
        $('#errormsg').text("Error:  Passwords do not match.");
        $('#errorbase').css('display', 'block');
        $('#signupBtn').html('<i class="fa fa-user-plus"></i> Sign Up');
        $('#signupBtn').attr('disabled', false);
        return;
    }
    $.post("https://sso.netsyms.com/api/adduser.php",
            {
                user: $('#usernameBox').val(),
                pass: $('#passwordBox').val(),
                name: $('#nameBox').val(),
                email: $('#emailBox').val()
            },
            function (data) {
                if (data === 'OK') {
                    $.getJSON(mkApiUrl('pinglogin') + "?user=" + $('#usernameBox').val(), function (out) {
                        if (out.status === 'OK') {
                            username = $('#usernameBox').val().toLowerCase();
                            password = $('#passwordBox').val();
                            localStorage.setItem("username", username);
                            localStorage.setItem("password", password);
                            navigator.splashscreen.hide();
                            checkUserHasTeamOpenChooserIfNot(username);
                        } else {
                            navigator.notification.alert("You've signed up successfully, but we can't log you in.  Restart the app and try again.", null, "Error", 'Dismiss');
                            authOpInProgress = false;
                        }
                    }).fail(function (err) {
                        navigator.notification.alert("You've signed up successfully, but we can't log you in.  Restart the app and try again.", null, "Error", 'Dismiss');
                        authOpInProgress = false;
                    });
                } else {
                    $('#signupBtn').html('<i class="fa fa-user-plus"></i> Sign Up');
                    $('#signupBtn').attr('disabled', false);
                    $('#errormsg').text("Error: " + data);
                    $('#errorbase').css('display', 'block');
                }
                authOpInProgress = false;
            }).fail(function () {
        $('#signupBtn').html('<i class="fa fa-user-plus"></i> Sign Up');
        $('#signupBtn').attr('disabled', false);
        $('#errormsg').text("Error: Network failure.");
        $('#errorbase').css('display', 'block');
        authOpInProgress = false;
    });
}

function dologin() {
    if (authOpInProgress) {
        return;
    }
    authOpInProgress = true;
    $('#errorbase').hide();
    if ($('#usernameBox').val() === "") {
        $('#errormsg').text("Error:  Missing username.");
        $('#errorbase').css('display', 'block');
        $('#loginBtn').html('<i class="fa fa-sign-in"></i> Login');
        $('#loginBtn').attr('disabled', false);
        return;
    }
    $('#loginBtn').attr('disabled', true);
    $('#loginBtn').html('<i class="fa fa-cog fa-spin fa-fw"></i> Logging in...');
    $.post("https://sso.netsyms.com/api/simpleauth.php",
            {user: $('#usernameBox').val(), pass: $('#passwordBox').val()},
            function (data) {
                if (data === 'OK') {
                    // Now that auth is OK, ping the game server
                    $.getJSON(mkApiUrl('pinglogin') + "?user=" + $('#usernameBox').val(), function (out) {
                        if (out.status === 'OK') {
                            username = $('#usernameBox').val().toLowerCase();
                            password = $('#passwordBox').val();
                            localStorage.setItem("username", username);
                            localStorage.setItem("password", password);
                            navigator.splashscreen.hide();
                            checkUserHasTeamOpenChooserIfNot(username);
                        } else {
                            $('#loginBtn').html('<i class="fa fa-sign-in"></i> Login');
                            $('#loginBtn').attr('disabled', false);
                            $('#errormsg').text("Error: " + out.message);
                            $('#errorbase').css('display', 'block');
                            $('#loading').css('display', 'none');
                            authOpInProgress = false;
                        }
                    }).fail(function (err) {
                        $('#loginBtn').html('<i class="fa fa-sign-in"></i> Login');
                        $('#loginBtn').attr('disabled', false);
                        $('#errormsg').text("Error: Login OK, but cannot connect to game server.  Try again later.");
                        $('#errorbase').css('display', 'block');
                        $('#loading').css('display', 'none');
                        authOpInProgress = false;
                        serverProblemsDialog("Cannot connect to game server.");
                    });
                } else {
                    $('#loginBtn').html('<i class="fa fa-sign-in"></i> Login');
                    $('#loginBtn').attr('disabled', false);
                    $('#errormsg').text(data);
                    $('#errorbase').css('display', 'block');
                    $('#loading').css('display', 'none');
                }
                authOpInProgress = false;
            }).fail(function () {
        $('#loginBtn').html('<i class="fa fa-sign-in"></i> Login');
        $('#loginBtn').attr('disabled', false);
        $('#errormsg').text("Error: Network failure.");
        $('#errorbase').css('display', 'block');
        $('#loading').css('display', 'none');
        authOpInProgress = false;
        serverProblemsDialog("Cannot connect to login server.");
    });
}

