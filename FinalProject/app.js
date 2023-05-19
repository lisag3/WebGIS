// custom yellow to dark pink color sceme for summer surface temps layer 
const styleSurfTemp = (feature)=> {
    const summerTemp = feature.properties.SurfTempDisplay;
    let fillColor = null;

    if (summerTemp < 91) {
        fillColor = null
    } else if (summerTemp < 95){
        fillColor = '#EEE55B'
    } else if (summerTemp < 97) {
        fillColor = '#DBAE62'
    } else if (summerTemp <99) {
        fillColor = '#C87869'
    } else if (summerTemp <101) {
        fillColor = '#B54170'
    } else if (summerTemp <104) {
        fillColor = '#A20B77'
    } else{
        fillColor = 'bfbfbf'
    }
    return {
        fillColor,
        fillOpacity: 1,
        color: '#fffae6',
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

// style for parent layer 
const styleParentLayer = (feature)=> {
    const Parent = feature;
    let fillColor = '#FFFFFF';

    return {
        fillColor,
        fillOpacity: 0,
        color: '#000000',
        opacity: 0,
        weight: 4,
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

// info box for neighborhood info
const infoBox = L.control();

infoBox.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'infoBox');
    this._div.style = `padding: 6px 8px;
    font: 14px/16px Arial, Helvetica, sans-serif;
    background: white;
    background: rgba(255,255,255);
    box-shadow: 0 0 15px rgba(0,0,0,0.2);
    border-radius: 5px;
    width: 300px;
    height: 110px;`
    this.update();
    return this._div;
};

infoBox.update = function (props) {
    if (!props) {
        this._div.innerHTML = 'Hover over a neighborhood';
    } else {
        this._div.innerHTML = `Neighborhood: ${props.GEONAME} 
        <br> Summer Surface Temp: ${props.SurfTempDisplay}
        <br> Heat Vulnerability Index: ${props.HVI}
        <br> Vegetative Cover: ${props.VegCovPercent}%
        <br> People of Color: ${props.PercentPOC}%`;
    }
}

// create parent layer used to trigger highlight and infobox
let parentLayer

const onEachFeature = (feature, layer) => {
    layer.on({
        mouseover: function (e) {
            const layer = e.target;

            layer.setStyle({
                weight: 3,
                color: '#9933FF',
                opacity: 1,
                dashArray: '',
                fillColor: '#E6CCFF',
                fillOpacity: 0.5
            });
        
            layer.bringToFront();
            infoBox.update(layer.feature.properties)
        },
        mouseout: (e) => {
            parentLayer.resetStyle(e.target);
            infoBox.update();
        },
    });
}

// pop ups on click for points - not working because of z-index issue 
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
    
    // get basemap layer 

    const TonerLite = L.tileLayer.provider('Stamen.TonerLite', {
        maxZoom:14,
        minZoom: 6,
    });

    // get points for cooling sites, points to layer, and style points, add pop ups on click
    const pointsResponse = await fetch( 'https://lisag3.github.io/WebGIS/FinalProject/Data/CoolingSites2020latlong.geojson' );
    const pointsData = await pointsResponse.json();
    
    const pointsGroup = L.geoJSON(pointsData, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, stylePoints);
        },
        onEachFeature: onEachFeature2,
    });

    // get data for neighborhood layers and style each layer  
    const NTAresponse = await fetch( 'https://lisag3.github.io/WebGIS/FinalProject/Data/NTA2010_AllData.geojson' );
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

    // create and add styles to neighborhood layers 
    const surfTempGroup = L.geoJSON(NTAdata, {
        style: styleSurfTemp,
    }); 

    const vegCovGroup = L.geoJSON(NTAdata, {
        style: styleVegCov
    });

    const HVIgroup = L.geoJSON(NTAdata, {
        style: styleHVI
    }); 

    // get parks data and style parks 
    const parksResponse = await fetch( 'https://lisag3.github.io/WebGIS/FinalProject/Data/ParksMod1acre.geojson' );
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
    map.createPane('parent');
    map.getPane('parent').style.zIndex = 450;

    infoBox.addTo(map);

    parentLayer = L.geoJSON(NTAdata, {
        style: styleParentLayer,
        onEachFeature: onEachFeature,
        pane: 'parent'
    }).addTo(map);

    const baseMaps = {
        "Vegetative Cover": vegCovGroup,
        "Heat Vulnerability": HVIgroup,
        "Surface Temps": surfTempGroup,
    };
    
    const overlayMaps = {
        "Parks >1 Acre": parksGroup,
        "New Cooling Features": pointsGroup,
        
    };
    const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

// add search control on parent layer
const searchControl = new L.Control.Search({
    layer: parentLayer,
    propertyName: 'GEONAME',
    marker: false,
});

searchControl.on('search:locationfound', function (e) {

    e.layer.setStyle({
        weight: 3,
        color: '#9933FF',
        opacity: 1,
        dashArray: '',
        fillColor: '#E6CCFF',
        fillOpacity: 0.5
    });
    e.layer.bringToFront();
    infoBox.update(e.layer.feature.properties);

}).on('search:collapsed', function (e) {

    parentLayer.eachLayer(function (layer) {	//restore feature color
        parentLayer.resetStyle(layer);
    });
    infoBox.update();
});

map.addControl(searchControl);  //inizialize search control
});

