// custom yellow to dark pink color sceme for summer surface temps layer 
const styleSurfTemp = (feature)=> {
    const summerTemp = feature.properties.SurfTempDisplay;
    let fillColor = null;

    if (summerTemp < 94) {
        fillColor = '#EEE55B'
    } else if (summerTemp < 96) {
        fillColor = '#DBAE62'
    } else if (summerTemp <98) {
        fillColor = '#C87869'
    } else if (summerTemp <100) {
        fillColor = '#B54170'
    } else if (summerTemp <104) {
        fillColor = '#A20B77'
    } else{
        fillColor = 'bfbfbf'
    }
    return {
        fillColor,
        fillOpacity: 1,
        color: '#bfbfbf',
        opacity: 1,
        weight: 1,
    }
}

// green color style for parks layer
const styleParks = (feature)=> {
    const Parks = feature;
    let fillColor = '#33cc33';

    return {
        fillColor,
        fillOpacity: 0.7,
        color: '#006600',
        opacity: 0.8,
        weight: 1,
    }
}

// interpolate colors for Heat Vulnerability layer that is on a scale of 1-5 
const styleHVI = (feature)=> {
    const HVIs = feature.properties.HVI;
        return {
            fillColor: d3.interpolateReds((HVIs*20)/100),
            fillOpacity: 1,
            color: d3.interpolateReds(0),
            opacity: 1,
            weight: 1,
        }
    }

// blue points style 
const stylePoints = {
    radius: 4,
    fillColor: '#00ffff',
    color: '#006666',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

// pop ups on mouseover for surface temps layer 
const onEachFeature = (feature, layer) => {
    const popupContent = `Neighborhood: ${feature.properties.GEONAME} 
        <br> Summer Temp: ${feature.properties.SurfTempDisplay}
        <br> Heat Vulnerability Index: ${feature.properties.HVI}
        <br> Vegetative Cover: ${feature.properties.VegCovPercent}%
        <br> People of Color: ${feature.properties.PercentPOC}%`;
    layer.bindPopup(popupContent)
    layer.on({
        mouseover: function (e) {
            e.target.openPopup();
        },
        mouseout: (e) => {
            e.target.closePopup();
        },
    });
}

// pop ups on click for points 
const onEachFeature2 = (feature, layer) => {
    const popupContent = `Location: ${feature.properties.PropertyName}
        <br> Type: ${feature.properties.FeatureType} 
        <br> Status: ${feature.properties.Status}`;
    layer.bindPopup(popupContent)
    layer.on({
        click: function (e) {
            e.target.openPopup();
        },
    });
}
window.addEventListener('DOMContentLoaded', async () => {
    
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 14,
        minZoom: 6,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const Watercolor = L.tileLayer.provider('Stamen.Watercolor', {
        maxZoom:14,
        minZoom: 6,
    });

    const TonerLite = L.tileLayer.provider('Stamen.TonerLite', {
        maxZoom:14,
        minZoom: 6,
    });

    const Terrain = L.tileLayer.provider('Stamen.Terrain', {
        maxZoom:14,
        minZoom: 6,
    });

    const pointsResponse = await fetch( 'https://lisag3.github.io/WebGIS/Lab5/Data/CoolingSites2020latlong.geojson' );
    const pointsData = await pointsResponse.json();
    
    const pointsGroup = L.geoJSON(pointsData, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, stylePoints);
        },
        onEachFeature: onEachFeature2,
    }); 

    const NTAresponse = await fetch( 'https://lisag3.github.io/WebGIS/Lab5/Data/NTA2010_AllData.geojson' );
    const NTAdata = await NTAresponse.json();
    
    // iterate through vegetative cover percent values to find min/max and use to create style with interpolated colors
    const minVegCov = NTAdata.features.reduce((min, f) => (!!f.properties.VegCovPercent && f.properties.VegCovPercent < min) ? f.properties.VegCovPercent : min, 100);
    const maxVegCov = NTAdata.features.reduce((max, f) => f.properties.VegCovPercent > max ? f.properties.VegCovPercent : max, 0);  
    
    const styleVegCov = (feature)=> {
        const vegCov = feature.properties.VegCovPercent;
        
        return {
            fillColor: d3.interpolateGreens((vegCov-minVegCov)/(maxVegCov-minVegCov)),
            fillOpacity: 1,
            color: d3.interpolateGreens(100),
            opacity: 1,
            weight: 1,
        }
    }

    const surfTempGroup = L.geoJSON(NTAdata, {
        style: styleSurfTemp,
        onEachFeature: onEachFeature,
    }); 

    const vegCovGroup = L.geoJSON(NTAdata, {
        style: styleVegCov
    });

    const HVIgroup = L.geoJSON(NTAdata, {
        style: styleHVI
    }); 

    const parksResponse = await fetch( 'https://lisag3.github.io/WebGIS/Lab5/Data/ParksMod1acre.geojson' );
    const parksData = await parksResponse.json();
    
    const parksGroup = L.geoJSON(parksData, {
        style: styleParks
    }); 

    // fullscreen control and layers control 
    const map = L.map('map', {
        center: [40.74, -74.0],
        zoom: 10, 
        fullscreenControl: true,
        layers: [TonerLite, surfTempGroup, HVIgroup, vegCovGroup, parksGroup, pointsGroup]
    });
    const baseMaps = {
        "Light Gray": TonerLite,
        "OpenStreetMap": osm,
        "Terrain": Terrain,
        "Watercolor": Watercolor,
        
    };
    const overlayMaps = {
        "Surface Temps": surfTempGroup,
        "Heat Vulnerability": HVIgroup,
        "Vegetative Cover": vegCovGroup,
        "Parks >1 Acre": parksGroup,
        "New Cooling Features": pointsGroup,
        
    };
    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

// add search control
const searchControl = new L.Control.Search({
    layer: surfTempGroup,
    propertyName: 'GEONAME',
    marker: false,
});

searchControl.on('search:locationfound', function (e) {

    e.layer.setStyle({ fillColor: '#3f0', color: '#0f0' });
    if (e.layer._popup)
        e.layer.openPopup();

}).on('search:collapsed', function (e) {

    surfTempGroup.eachLayer(function (layer) {	//restore feature color
        surfTempGroup.resetStyle(layer);
    });
});

map.addControl(searchControl);  //inizialize search control
});

