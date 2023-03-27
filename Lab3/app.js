const stylecommDist = (feature)=> {
    const summerTemp = feature.properties.DisplayTemp;
    let fillColor = null;

    if (summerTemp < 94) {
        fillColor = '#EEE55B'
    } else if (summerTemp < 96) {
        fillColor = '#DBAE62'
    } else if (summerTemp <98) {
        fillColor = '#C87869'
    } else if (summerTemp <100) {
        fillColor = '#B54170'
    } else if (summerTemp <103) {
        fillColor = '#A20B77'
    } else{
        fillColor = 'bfbfbf'
    }
    return {
        fillColor,
        fillOpacity: 0.7,
        color: '#bfbfbf',
        opacity: 0.8,
        weight: 2,
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const map = L.map('map').setView([40.74, -74.0], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    const response = await fetch( 'https://lisag3.github.io/WebGIS/Temp_by_CD_mod.geojson' );
    const commDist = await response.json();
    
    const commDistGroup = L.geoJSON(commDist, {
        style: stylecommDist
    }).addTo(map); 

});
