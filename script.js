var map;
var dataFromGoogleSheets;
var userMarker;

function initMap() {
    map = L.map('map').setView([-6.1754, 106.8272], 13);

    var defaultBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var satelliteBasemap = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    var basemaps = {
        "Street Map": defaultBasemap,
        "Satellite": satelliteBasemap
    };

    L.control.layers(basemaps).addTo(map);

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
    }).then(function() {
        gapi.client.load('sheets', 'v4', function() {
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: '1D2PTqmBmgIe65zbqzXD9kEjQLW6idQelDgv-_EMOCAQ', 
                range: 'Sheet1', 
            }).then(function(response) {
                dataFromGoogleSheets = response.result.values;

                for (var i = 1; i < dataFromGoogleSheets.length; i++) {
                    var lat = parseFloat(dataFromGoogleSheets[i][4]);
                    var lng = parseFloat(dataFromGoogleSheets[i][5]);
                    var name = dataFromGoogleSheets[i][1];
                    var popupContent = "<b>" + name + "</b><br>ID Stasiun: " + dataFromGoogleSheets[i][0] + "<br>Provinsi: " + dataFromGoogleSheets[i][2] + "<br>Kab/Kota: " + dataFromGoogleSheets[i][3] + "<br>Lat: " + lat + "<br>Long: " + lng + "<br>Ketinggian: " + dataFromGoogleSheets[i][6] + "<br>Catatan: " + dataFromGoogleSheets[i][7];

                    L.marker([lat, lng]).addTo(map)
                        .bindPopup(popupContent);
                    
                    addToBuildingList(name, lat, lng);
                }
            }, function(response) {
                console.error('Error: ' + response.result.error.message);
            });
        });
    });
}

function addToBuildingList(name, lat, lng) {
    var buildingList = document.getElementById("building-list");
    var listItem = document.createElement("li");
    var link = document.createElement("a");

    link.textContent = name;
    link.href = "#";
    link.onclick = function() {
        map.setView([lat, lng]);
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

        L.marker([lat, lng]).addTo(map)
            .bindPopup(popupContent);
        
        addToBuildingList(name, lat, lng);
    }
}


document.addEventListener("DOMContentLoaded", function() {
    gapi.load('client', initMap);

    var searchInput = document.getElementById("search-input");
    searchInput.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) { 
            searchLocation();
        }
    });
});
