/* global PositionError */

//////////////////////////////////////////////
//  GPS and terrain stuff
//////////////////////////////////////////////

/**
 * Handles GPS and terrain data.
 */

// Globals
lockGot = false;
terrainGot = false;
latitude = 0.0000;
longitude = 0.0000;
gpsaccuracy = 9999;
// End Globals

var lastgpstime = 0;
var terraintypeid = 0;
var map = L.map('map');
var tileurl = "http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg";
map.setZoom(17);
map.dragging.disable();
//map.touchZoom.disable();
//map.doubleClickZoom.disable();
//map.scrollWheelZoom.disable();
map.keyboard.disable();
$(".leaflet-control-zoom").css("visibility", "hidden");
// Disable tap handler, if present.
//if (map.tap) {
//    map.tap.disable();
//}

// Tile layer
map.addLayer(new L.tileLayer(tileurl, {minZoom: 17, maxZoom: 18}));
// Places layer
var placeLayer = L.geoJson(
        {"name": "Places", "type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}, "properties": {"osm_id": -1, "name": null}}]},
        {
            onEachFeature: onPlaceTap,
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 14,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.6
                });
            }
        }).addTo(map);

var lc = L.control.locate({
    position: 'topleft', // set the location of the control
    layer: undefined, // use your own layer for the location marker, creates a new layer by default
    drawCircle: false, // controls whether a circle is drawn that shows the uncertainty about the location
    follow: true, // follow the user's location
    setView: true, // automatically sets the map view to the user's location, enabled if `follow` is true
    keepCurrentZoomLevel: true, // keep the current map zoom level when displaying the user's location. (if `false`, use maxZoom)
    stopFollowingOnDrag: false, // stop following when the map is dragged if `follow` is true (deprecated, see below)
    remainActive: true, // if true locate control remains active on click even if the user's location is in view.
    markerClass: L.circleMarker, // L.circleMarker or L.marker
    circleStyle: {}, // change the style of the circle around the user's location
    markerStyle: {},
    followCircleStyle: {}, // set difference for the style of the circle around the user's location while following
    followMarkerStyle: {},
    icon: 'fa fa-map-marker', // class for icon, fa-location-arrow or fa-map-marker
    iconLoading: 'fa fa-spinner fa-pulse', // class for loading icon
    iconElementTag: 'span', // tag for the icon element, span or i
    circlePadding: [0, 0], // padding around accuracy circle, value is passed to setBounds
    metric: true, // use metric or imperial units
    onLocationError: function (err) {
    }, // define an error callback function
    onLocationOutsideMapBounds: function (context) { // called when outside map boundaries
    },
    showPopup: false, // display a popup when the user click on the inner marker
    strings: {
        title: ".", // title of the locate control
        metersUnit: "meters", // string for metric units
        feetUnit: "feet", // string for imperial units
        popup: "You are within {distance} {unit} from this point", // text to appear if user clicks on circle
        outsideMapBoundsMsg: "You seem located outside the boundaries of the map" // default message for onLocationOutsideMapBounds
    },
    locateOptions: {}  // define location options e.g enableHighAccuracy: true or maxZoom: 10
}).addTo(map);
lc.start();
function mapPos(lat, lon) {
    lockGot = true;
    hideLoading();
    loadPlaces(latitude, longitude);
    //map.setView(new L.LatLng(lat, lon), 16, {animate: true});
    //map.panTo(new L.LatLng(lat, lon));
    //map.invalidateSize();
    //redraw('.leaflet-map-pane');
//    $('.leaflet-map-plane').css('height', '90%');
//    setTimeout(function () {
//        $('#map').css('width', '100%');
//        $('#map').css('height', '100%');
//    }, 100);
}

function onPlaceTap(feature, layer) {
    layer.on('click', function (e) {
        openPlace(feature);
    });
}

function loadPlaces(lat, long) {
    $.getJSON(
            "http://earth.apis.netsyms.net/places.php?format=geojson&lat=" + lat + "&long=" + long + "&radius=.25&names=1",
            function (data) {
                if (data.type === 'FeatureCollection') {
                    placeLayer.clearLayers();
                    data.features.forEach(function (item) {
                        item.properties.popupContent = "<span class='marker-popup-text' onclick='openplace(" + item.properties.osm_id + ")'>" + item.properties.name + "</span>";
                        placeLayer.addData(item);
                    });
                }
            });
}

function openPlace(feature) {
    $('#main-content').load("screens/place.html", null, function () {
        loadPlace(feature);
        $('#overlay-main').css('display', 'block');
    });
}

/**
 * Hide the loading overlay if everything is loaded, otherwise do nothing
 */
function hideLoading() {
    if (lockGot && terrainGot && gpsaccuracy < 30 && $('#loading').css('display') !== 'none') {
        $('#loading').fadeOut('slow', function () {
            $('#loading').css('display', 'none');
        });
    }
}

var updatePosition = function (position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    lastgpstime = position.timestamp;
    gpsaccuracy = position.coords.accuracy;
    if (gpsaccuracy > 30) {
        $('#no-lock').css('display', 'block');
    } else {
        $('#no-lock').css('display', 'none');
    }
    mapPos(latitude, longitude);
};
var updateTerrain = function (position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    lastgpstime = position.timestamp;
    gpsaccuracy = position.coords.accuracy;
    var rasterurl = "http://earth.apis.netsyms.net/terrain.php?format=json&lat="
            + latitude + "&long=" + longitude;
    $.get(rasterurl, function (data) {
        if (data.status === 'OK') {
            terraintypeid = data.typeid;
            terraintypename = data.typename;
            $('#terrain-image').attr('src', 'assets/terrain/' + terraintypeid + '.png');
            terrainGot = true;
            hideLoading();
        }
    }, "json").fail(function (err) {
        $('#terrain-image').attr('src', 'assets/terrain/0.png');
    });
};
function pingServer() {
    if (lockGot && gpsaccuracy < 30) {
        $.get(mkApiUrl('ping') + "?user=" + username + "&lat=" + latitude + "&long=" + longitude);
    }
}
;
function onError(error) {
    $('#loading-error').text("Check your device's network and location settings, and ensure a clear view of the sky.");
}

function popGPS() {
    navigator.notification.alert("Latitude: " + latitude +
            "\nLongitude: " + longitude +
            "\nAccuracy: " + gpsaccuracy +
            "\nTerrain: " + terraintypename + " (" + terraintypeid + ")",
            null,
            "GPS Information",
            "Close");
}
$('#terrain-image').click(function () {
    popGPS();
});
// Initial GPS position and stuff
navigator.geolocation.getCurrentPosition(updateTerrain, onError, {timeout: 10000, enableHighAccuracy: true});
// Update position
setInterval(function () {
    navigator.geolocation.getCurrentPosition(updatePosition, onError, {timeout: 10000, enableHighAccuracy: true});
}, 1000);
// Update position + terrain
setInterval(function () {
    navigator.geolocation.getCurrentPosition(updateTerrain, onError, {timeout: 10000, enableHighAccuracy: true});
    loadPlaces(latitude, longitude);
}, 1000 * 20);
// Ping the server with coordinates
setInterval(pingServer, 5000);
// Show error if it's taking too long
setTimeout(function () {
    onError();
}, 15 * 1000);


//////////////////////////////////////////////
//  Profile, stats, and chat stuff
//////////////////////////////////////////////


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
            long: longitude
        }, function (data) {
            data = sortResults(data, 'time', true);
            var content = "";
            data.forEach(function (msg) {
                content += "<span class='chat-username' onclick='openProfile(\"" + msg.username + "\");'>" + msg.username + "</span> " + msg.message + "<br />";
            });
            $('#chatmsgs').html(content);
        });
    }
}


syncStats();
setInterval(function () {
    syncStats();
}, 10 * 1000);
setInterval(function () {
    getChat();
}, 2000);
// Send chat messages
$("#chatsendform").submit(function (event) {
    message = $('#chatbox-input').val();
    if (message !== '') {
        $.post(mkApiUrl('chat', 'cs'), {
            user: username,
            lat: latitude,
            long: longitude,
            msg: message
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
    });
}

function openRules() {
    openmodal('rules', '#rules-modal');
}

function openMenu(topage) {
    topage = typeof topage !== 'undefined' ? topage : "";
    $('#main-content').load("screens/menu.html", null, function (x) {
        $('#overlay-main').css('display', 'block');
        if (topage !== '') {
            $('#' + topage + '-tab').tab('show');
        }
    });
}



//////////////////////////////////////////////
//  Other things
//////////////////////////////////////////////

function closeMain() {
    $('#overlay-main').slideDown(100, function () {
        $('#overlay-main').css('display', 'none');
        $('#main-content').html("");
    });
}

// Handle back button to close things
document.addEventListener("backbutton", function (event) {
    if ($('#overlay-main').css('display') !== 'none') {
        closeMain();
    } else if ($('#chatmsgs').css('display') !== 'none') {
        toggleChat();
    }
}, false);
// Show the rules
if (localStorage.getItem("seenrules") !== 'yes') {
    openRules();
    localStorage.setItem("seenrules", 'yes');
}