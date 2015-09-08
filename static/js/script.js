var markers = [];
var divids = [];
var instaMarkers = [];
var INSTAID='';
var ACCESSTOKEN = '';


$(document).ready(function() {
  // Set up our map options and create the map when the page is loaded / "ready"
  var mapOptions = {
    center: new google.maps.LatLng(39.828060, -98.579440),
    zoom: 4,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: mapstyle
  };
  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  geocoder = new google.maps.Geocoder();

  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
  } else { 
      alert("Geolocation is not supported by this browser.");
  }

  //Handle the click of the Geocode Search Box
  $("#searchButton").click(function() {
    codeAddress();
  });

  //Also listen for an Enter key press on the Geocode Search Box
  $('#searchText').keypress(function(e) {
    var key = e.which;
    if (key == 13) // the enter key code
    {
      $("#searchButton").click();
      return false;
    }
  });

  // when hovering mouse over a photo, trigger the comment overlay
  // and corresponding map marker bounce effect
  $('#photos').on("mouseenter",".photodiv",function(){
    $(this).children('.caption').show();
    e = $(this).attr('id');
    for (var i = 0; i < instaMarkers.length; i++) {
    var i_id = instaMarkers[i][1];
    if (i_id == e){
      instaMarkers[i][0].setAnimation(google.maps.Animation.BOUNCE);
    }
  }
  });

  $('#photos').on("mouseleave",".photodiv",function(){
    $('.caption').hide();
    e = $(this).attr('id');
    for (var i = 0; i < instaMarkers.length; i++) {
    var i_id = instaMarkers[i][1];
    if (i_id == e){
      instaMarkers[i][0].setAnimation(null);
    }
  }
  });

});


function codeAddress() {
  var address = $("#searchText").val();
  var searchBounds = new google.maps.LatLngBounds();
  var searchLatLng = null;
  geocoder.geocode({
    'address': address,
    'bounds': searchBounds
  }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      searchLatLng = results[0].geometry.location;
      map.setCenter(searchLatLng);
      map.setZoom(15)
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
  $("#searchText").val('');
}


var newLatLng = function (success) {
   return new google.maps.LatLng(success.coords.latitude, success.coords.longitude);
}

function successFunction(success) {
  var navLatLng = newLatLng(success);
  console.log(navLatLng);
  var location = {lat: navLatLng.G, lng: navLatLng.K, dist: '1000'};
  map.setCenter(navLatLng);
  map.setZoom(15)
  placePin(navLatLng);
  console.log(location);
  getNewPhotos(location);
  mapClickListener();
  }

function errorFunction(success) {
  var navLatLng = new google.maps.LatLng(37.808631, -122.474470);
  var location = {lat: 37.808631, lng: -122.474470, dist: '1000'};
  map.setCenter(navLatLng);
  map.setZoom(15);
  placePin(navLatLng);  
  console.log(location);
  getNewPhotos(location);
  mapClickListener();
  }

function placePin(coords) {
  removePins();
    var marker = new google.maps.Marker({
    position: coords,
    map: map,
  });
    markers.push(marker);
}

function placeInstaMarkers(data, map) {
  removeInstaMarkers();
  var image = '/static/img/insta.png';
  for (var i = 0; i < data.length; i++) {
    var latLng = new google.maps.LatLng(data[i].location.latitude, data[i].location.longitude);
    var instaMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: image
    });
    instaMarkers.push([instaMarker,data[i].id]);
    instaMarker.setAnimation(google.maps.Animation.DROP);
    // addInfoWindow(data, instaMarker, i);
  };
  console.log(instaMarkers);
}


function removePins() {
  if (markers) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
      markers=[];
    }
  }
}

function removeInstaMarkers() {
  if (instaMarkers) {
    for (var i = 0; i < instaMarkers.length; i++) {
      instaMarkers[i][0].setMap(null);
    }
    instaMarkers=[];
  }
console.log(instaMarkers);
}

function mapClickListener() {
  google.maps.event.addListener(map, 'click', function(event) {
    console.log('map click');
    removePins();
    console.log(event);
    placePin(event.latLng);
    var currentPos = {lat: event.latLng.lat(), lng: event.latLng.lng(), dist: '1000'};
    console.log(currentPos);
    a = getNewPhotos(currentPos);
    console.log(a);
  });
}


//basic ajax call to instagram API, searching for photos within specified distance of passed in place
var getNewPhotos = function (data) {
  $( "#photos" ).empty();
  $.ajax({
    url: 'https://api.instagram.com/v1/media/search?callback=?',
    dataType: 'json',
    data: {'order': '-createdAt', lat: data.lat, lng: data.lng, distance:data.dist, client_id: INSTAID, access_token: ACCESSTOKEN},
    success: jsonLoad,
    statusCode: {
      500: function () {
        alert('Sorry, service is temporarily down.');
      }
    }
  });
};

//processses the json data on ajax success
function jsonLoad (json) {
  if (json.meta.code == 200) {
    var show = json.data;
    var instacomment;
    console.log(show);
    jQuery.each(show, function(i, val) {
       var instaimg = "'" + val.images.low_resolution.url + "'";
       var instaid = val.id;
       console.log(instaid);
       if (val.caption) {
       instacomment = "'" + val.caption.text + "'";
     } else {instacomment = '';}
       console.log(instacomment);
       var $photodiv = $("<div class='photodiv' id = '" + instaid + "'><img class='photo' src=" + instaimg + " /><div class='caption'><p>" + instacomment + "</p></div>");
       $("#photos").append($photodiv);
     });
    placeInstaMarkers(show, map);
    // Session.set('photoset', show);
    // $(event.target.children[1]).hide();
  }
   else{
    alert("Instagram API limit exceeded");
  };
}



var mapstyle = [
    {
        "featureType": "all",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "lightness": 33
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "lightness": "23"
            }
        ]
    },
    {
        "featureType": "administrative.neighborhood",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.neighborhood",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#f2e5d4"
            }
        ]
    },
    {
        "featureType": "landscape.natural",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "lightness": "31"
            },
            {
                "weight": "1.00"
            }
        ]
    },
    {
        "featureType": "poi.attraction",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.attraction",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.business",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "poi.government",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#c5dac6"
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "saturation": "15"
            },
            {
                "hue": "#7eff00"
            },
            {
                "lightness": "1"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "saturation": "-50"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#d8d8d8"
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#e4d7c6"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#fbfaf7"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "invert_lightness": true
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#acbcc9"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "lightness": "9"
            },
            {
                "saturation": "-92"
            },
            {
                "hue": "#00daff"
            }
        ]
    }
]


