/*
 * TerranQuest - Augmented Reality fantasy game
 *
 * Copyright 2016 Netsyms Technologies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//////////////////////////////////////////////
//  Profile, stats, and chat stuff
//////////////////////////////////////////////

var rawWeatherData = [];

/*
 * Handles general server communication.
 */

/**
 * Syncs the user's stats with the server and calls refreshStats().
 */
function syncStats() {
    $.getJSON(mkApiUrl('getstats'), {
        user: username
    }, function (data) {
        if (data.status === 'OK') {
            maxenergy = data.stats.maxenergy;
            energy = data.stats.energy;
            level = data.stats.level;
            refreshStats();
        }
    });
}

/**
 * Display the current stats on the home screen.
 */
function refreshStats() {
    energypercent = (energy * 1.0 / maxenergy * 1.0) * 100.0;
    $('#energybar').css('width', String(energypercent) + '%');
}

function getChat() {
    if (lockGot) {
        $.getJSON(mkApiUrl('chat', 'cs'), {
            lat: latitude,
            long: longitude,
            name: username
        }, function (data) {
            data = sortResults(data, 'time', true);
            var content = "";
            data.forEach(function (msg) {
                var usernameclass = "chat-username";
                if (msg.nickname === 'skylarmt') {
                    usernameclass = "chat-username-admin";
                }
                content += "<span class='" + usernameclass + "' onclick='openProfile(\"" + msg.nickname + "\");'>" + msg.nickname + "</span> " + msg.message + "<br />";
            });
            $('#chatmsgs').html(content);
        });
    }
}

var skycons = new Skycons({"color": "black", "resizeClear": true});
skycons.add("weathericon", "clear-day");

function getWeather() {
    $.getJSON(mkApiUrl('getweather'), {
        lat: latitude,
        long: longitude
    }, function (data) {
        var currently = data.currently;
        rawWeatherData = currently;
        skycons.set("weathericon", currently.icon);
    });
}

function weatherLoadWait() {
    setTimeout(function () {
        if (lockGot) {
            getWeather();
        } else {
            weatherLoadWait();
        }
    }, 2 * 1000);
}

syncStats();
setInterval(function () {
    syncStats();
}, 10 * 1000);
setInterval(function () {
    getChat();
}, 3000);
setInterval(function () {
    getWeather();
}, 30 * 1000);
// Send chat messages
$("#chatsendform").submit(function (event) {
    var message = $('#chatbox-input').val();
    if (message !== '') {
        $.post(mkApiUrl('chat', 'cs'), {
            lat: latitude,
            long: longitude,
            msg: message,
            name: username
        }, function (data) {
            if (data.status === 'OK') {
                $('#chatbox-input').val("");
                $("#chatmsgs").animate({scrollTop: $('#chatmsgs').prop("scrollHeight")}, 1000);
            }
        }, "json");
    }
    event.preventDefault();
    return false;
});
function toggleChat() {
    if ($('#chatmsgs').css('display') === 'none') {
        openChat();
    } else {
        closeChat();
    }
}

function closeChat() {
    $('#chatmsgs').css('display', 'none');
    $('#chatbox').css('height', 'auto');
}

function openChat() {
    $('#chatbox').css('height', '50%');
    $('#chatmsgs').css('display', 'block');
    $("#chatmsgs").animate({scrollTop: $('#chatmsgs').prop("scrollHeight")}, 1000);
}

function openProfile(user) {
    user = typeof user !== 'undefined' ? user : username;
    $('#main-content').load("screens/profile.html", null, function (x) {
        $('#overlay-main').css('display', 'block');
        loadProfile(user);
        updateStatusBarColor();
    });
}

function openRules() {
    openmodal('rules', '#rules-modal');
}

function openIntro() {
    openmodal('intro', '#intro-modal');
}

function openMenu(topage) {
    topage = typeof topage !== 'undefined' ? topage : "";
    $('#main-content').load("screens/menu.html", null, function (x) {
        $('#overlay-main').css('display', 'block');
        if (topage !== '') {
            $('#' + topage + '-tab').tab('show');
        }
        updateStatusBarColor();
    });
}
