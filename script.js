var map;
var dataFromGoogleSheets;
var userMarker;
var stationLayers = {
    "utama": new L.LayerGroup(),
    "geofisika": new L.LayerGroup(),
    "meteorologi": new L.LayerGroup(),
    "klimatologi": new L.LayerGroup(),
    "gaw": new L.LayerGroup()
};

function initMap() {
    map = L.map('map').setView([-2.331, 117.2841], 5);

    var defaultBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var satelliteBasemap = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&apikey=AIzaSyAbXF62gVyhJOVkRiTHcVp_BkjPYDQfH5w', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>'
    });

    var basemaps = {
        "Street Map": defaultBasemap,
        "Satellite Map": satelliteBasemap
    };

    var overlays = {
        "Stasiun Utama": stationLayers.utama,
        "Stasiun Geofisika": stationLayers.geofisika,
        "Stasiun Meteorologi": stationLayers.meteorologi,
        "Stasiun Klimatologi": stationLayers.klimatologi,
        "Stasiun GAW": stationLayers.gaw
    };

    for (var key in stationLayers) {
        if (stationLayers.hasOwnProperty(key)) {
            map.addLayer(stationLayers[key]);
        }
    }

    L.control.layers(basemaps, overlays).addTo(map);

    defaultBasemap.addTo(map);

    var locateBtn = L.control.locate({    
        position: 'topleft',
        strings: {
            title: "Temukan Lokasi Saya"
        }
    }).addTo(map);

    map.locate({ setView: true, maxZoom: 16 });
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    
    L.control.measure({
        position: 'topleft',
        primaryLengthUnit: 'meters',
        primaryAreaUnit: 'sqmeters',
        secondaryAreaUnit: undefined,
    }).addTo(map);

    getDataFromGoogleSheets();
}

function onLocationFound(e) {
    var radius = e.accuracy / 2;

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.circleMarker(e.latlng, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 1,
        radius: 8
    }).addTo(map).bindPopup("Anda berada di sini").openPopup();
}

function onLocationError(e) {
    alert("Tidak dapat menemukan posisi Anda.");
}

function getDataFromGoogleSheets() {
    gapi.client.init({
        apiKey: 'AIzaSyDoJpF9qD0taO6qc-FdHfo3UYjDpbxDrRY',
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    }).then(function () {
        gapi.client.load('sheets', 'v4', function () {
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: '1D2PTqmBmgIe65zbqzXD9kEjQLW6idQelDgv-_EMOCAQ',
                range: 'Sheet1',
            }).then(function (response) {
                dataFromGoogleSheets = response.result.values;

                for (var i = 1; i < dataFromGoogleSheets.length; i++) {
                    var lat = parseFloat(dataFromGoogleSheets[i][4]);
                    var lng = parseFloat(dataFromGoogleSheets[i][5]);
                    var name = dataFromGoogleSheets[i][1];
                    var popupContent = "<b>" + name + "</b><br>ID Stasiun: " + dataFromGoogleSheets[i][0] + "<br>Provinsi: " + dataFromGoogleSheets[i][2] + "<br>Kab/Kota: " + dataFromGoogleSheets[i][3] + "<br>Lat: " + lat + "<br>Long: " + lng + "<br>Ketinggian: " + dataFromGoogleSheets[i][6] + "<br>Catatan: " + dataFromGoogleSheets[i][7] + "<br><a href='https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng + "' target='_blank'>Lihat di Google Maps</a>";
                    
                    var stationType = dataFromGoogleSheets[i][8];
                    var markerColor;

                    switch (stationType.toLowerCase()) {
                        case "utama":
                            markerColor = "red";
                            break;
                        case "geofisika":
                            markerColor = "yellow";
                            break;
                        case "meteorologi":
                            markerColor = "green";
                            break;
                        case "klimatologi":
                            markerColor = "blue";
                            break;
                        case "gaw":
                            markerColor = "orange";
                            break;
                        default:
                            markerColor = "gray";
                            break;
                    }

                    L.marker([lat, lng], { icon: createCustomIcon(markerColor) }).addTo(stationLayers[stationType.toLowerCase()])
                        .bindPopup(popupContent);

                    addToBuildingList(name, lat, lng);
                }
            }, function (response) {
                console.error('Error: ' + response.result.error.message);
            });
        });
    });
}

function createCustomIcon(color) {
    return new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + color + '.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

function addToBuildingList(name, lat, lng) {
    var buildingList = document.getElementById("building-list");
    var listItem = document.createElement("li");
    var link = document.createElement("a");

    link.textContent = name;
    link.href = "#";
    link.onclick = function () {
        map.setView([lat, lng], 12);
        return false;
    };

    listItem.appendChild(link);
    buildingList.appendChild(listItem);
}

function searchLocation() {
    var input = document.getElementById("search-input").value;
    var searchResult = [];

    for (var i = 1; i < dataFromGoogleSheets.length; i++) {
        var name = dataFromGoogleSheets[i][1];
        if (name.toLowerCase().includes(input.toLowerCase())) {
            searchResult.push(dataFromGoogleSheets[i]);
        }
    }

    displaySearchResultOnMap(searchResult);
}

function displaySearchResultOnMap(searchResult) {
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    var buildingList = document.getElementById("building-list");
    buildingList.innerHTML = "";

    for (var i = 0; i < searchResult.length; i++) {
        var lat = parseFloat(searchResult[i][4]);
        var lng = parseFloat(searchResult[i][5]);
        var name = searchResult[i][1];
        var popupContent = "<b>" + name + "</b><br>ID Stasiun: " + searchResult[i][0] + "<br>Provinsi: " + searchResult[i][2] + "<br>Kab/Kota: " + searchResult[i][3] + "<br>Lat: " + lat + "<br>Long: " + lng + "<br>Ketinggian: " + searchResult[i][6] + "<br>Catatan: " + searchResult[i][7];

        var stationType = searchResult[i][8];
        var markerColor;

        switch (stationType.toLowerCase()) {
            case "utama":
                markerColor = "red";
                break;
            case "geofisika":
                markerColor = "yellow";
                break;
            case "meteorologi":
                markerColor = "green";
                break;
            case "klimatologi":
                markerColor = "blue";
                break;
            case "gaw":
                markerColor = "orange";
                break;
            default:
                markerColor = "gray";
                break;
        }

        L.marker([lat, lng], { icon: createCustomIcon(markerColor) }).addTo(map)
            .bindPopup(popupContent);

        addToBuildingList(name, lat, lng);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    gapi.load('client', initMap);

    var searchInput = document.getElementById("search-input");
    searchInput.addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            searchLocation();
        }
    });
});
