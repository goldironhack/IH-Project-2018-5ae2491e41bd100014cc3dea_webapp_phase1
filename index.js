var NY_district_shapes_URL = "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson";
var NY_district_names_URL = "https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json?accessType=DOWNLOAD";
var NY_crimes_URL = "https://data.cityofnewyork.us/api/views/qgea-i56i/rows.json?accessType=DOWNLOAD";
var NY_building_URL = "https://data.cityofnewyork.us/api/views/hg8x-zxpr/rows.json?accessType=DOWNLOAD";
/*
Borough no:
1 Manhattan 12
2 Bronx 12
3 Brooklyn 18
4 Queens 14
5 Staten Island 3

*/
var boroughs = [{name: "Manhattan", districts: [] },
                {name: "Bronx", districts: [] },
                {name: "Brooklyn", districts: [] },
                {name: "Queens", districts: [] },
                {name: "Staten Island", districts: [] }];
//RAW
var districtsFeatures;
var districts = new Array(71);
var districtsPolygons = new Array(71);
var infoRows = [];
var map;

/*function containsLocation(LatLng, district){
    var poly = districtsFeatures[district].geometry.coordinates;
    return google.maps.geometry.containsLocation();
}*/

function getNYDistrictsFeatures(){
    districtsFeatures = $.get(NY_district_shapes_URL).done(function(){
        districtsFeatures = $.parseJSON(districtsFeatures.responseText);
        districtsFeatures = districtsFeatures.features;
        console.log(districtsFeatures.length);
        for (var i = 0; i < districtsFeatures.length; i++) {
            var boroCD = districtsFeatures[i].properties.BoroCD;
            boroughId = boroCD/100>>0;
            districtId = boroCD%100;
            boroughs[boroughId - 1].districts.push(i);
            var data = districtsFeatures[i].geometry.coordinates;
            var coords = [];
            var dataRow;
            if(data.length > 1){
                for (var j = 0; j < data.length; j++) {
                    var path = [];
                    dataRow = data[j][0];
                    for (var k = 0; k < dataRow.length; k++) {
                        path.push({lat: dataRow[k][1], lng: dataRow[k][0]});
                    }
                    coords.push(path);
                }
            }else{
                data = data[0];
                for (var p = 0; p < data.length; p++) {
                    coords.push({lat: data[p][1], lng: data[p][0]});
                }
            }
            districtsPolygons[i] = new google.maps.Polygon({
                paths: coords,
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35
            });
        }

    }).fail(function(){
        console.log("NYdistrictShape Bad");
    });
}

function getNYnames(){
    var data = $.get(NY_district_names_URL).done(function(){
        data = data.responseJSON.data;
        for (var i = 0; i < data.length; i++) {
            var district;
            /*for (var j = 0; j < 71; j++) {
                if(containsLocation(data[i][9], i)){
                    district = i+1;
                    break;
                }
            }*/
            point = data[i][9];
            point = point.substring(7, point.length - 1).split(" ");
            infoRows.push([ data[i][8], parseFloat(point[1]), parseFloat(point[0]),data[i][10], data[i][16] ]);
            console.log(infoRows[1]);
            console.log(infoRows[2]);
        }
        var tBody = $("#tBody");
        for (i = 0; i < infoRows.length; i++) {
            id = infoRows[i][0];
            lat = infoRows[i][1];
            lng = infoRows[i][2];
            name = infoRows[i][3];
            borough = infoRows[i][4];
            tBody.append($("<tr>")
            .append($("<td>").append(id))
            .append($("<td>").append(lat))
            .append($("<td>").append(lng))
            .append($("<td>").append(name))
            .append($("<td>").append(borough))
            );
        }
    }).fail(function(){
        console.log("NYnames bad");
    });
}

function initMap() {
    var nyu = {lat: 40.7291, lng: -73.9965};
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: nyu
    });
    var marker = new google.maps.Marker({
      position: nyu,
      map: map
    });
    //map.data.loadGeoJson(NY_district_shapes_URL);
}

function removeDistrict(a){
    if(isNaN(a) || a < 0 || a > 70){
        console.log("Bad removeDistrict");
        return;
    }
    if(districtsPolygons[a] === undefined){
        return;
    }
    districtsPolygons[a].setMap(null);
}

function removeBorough(a){
    if(isNaN(a) || a < 0 || a > 4){
        console.log("bad");
        return;
    }
    boroDistricts = boroughs[a].districts;
    for (var i = 0; i < boroDistricts.length; i++) {
        removeDistrict(boroDistricts[i]);
    }
}

function addDistrict(a){
    if(isNaN(a) || a < 0 || a > 70){
        console.log("Bad addDistrict");
        return;
    }
    districtsPolygons[a].setMap(map);
    lastDistrict = a;
}

function addBorough(a){
    if(isNaN(a) || a < 0 || a > 4){
        console.log("Borough No must be less than 6");
        return;
    }
    boroDistricts = boroughs[a].districts;
    for (var i = 0; i < boroDistricts.length; i++) {
        addDistrict(boroDistricts[i]);
    }
}

function clearBorders(){
    for (var i = 0; i < 71; i++) {
        removeDistrict(i);
    }
}

function addDistrictInput(){
    var a = parseInt($("#districtNo").val());
    addDistrict(a-1);
}

function addBoroughInput(){
    var a = parseInt($("#boroughNo").val());
    addBorough(a-1);
}

function addBoroughsCheckBoxes(){
    removeLastBorough = false;
    var checkBoxes = $("#boroughCheckboxes input:checkbox").each(function(i){
        if(this.checked){
            addBorough(i);
        }else{
            removeBorough(i);
        }
    });
    removeLastBorough = true;
}

$("document").ready(function(){
    getNYDistrictsFeatures();
    $("#getData").click(getNYnames);
    $("#getNYDistrictShape").click(addDistrictInput);
    $("#getNYBoroughShape").click(addBoroughInput);
    $("#addBoroughsCheckBoxes").click(addBoroughsCheckBoxes);
    $("#clearBorders").click(clearBorders);
})
