function csvRow(row){
    return {
        continent: row.Continent,
        country: row.Country,
        countryCode: row["Country Code"],
        emissions: +row["Emissions"],
        emissionsPerCapita: +row["Emissions Per Capita"],
        region: row.Region,
        year: +row.Year  //convert Year column to number
    }
}

Promise.all([
    d3.json("//unpkg.com/world-atlas@1.1.4/world/50m.json"),
    d3.csv("./data/all_data.csv", csvRow)
]).then(function ([mapData, data]){

    var extremeYears = d3.extent(data, d => d.year);
    var currentYear = extremeYears[0];
    var currentDataType = d3.select('input[name="data-type"]:checked')
        .attr("value");
    var geoData = topojson.feature(mapData, mapData.objects.countries).features;

    var width = +d3.select(".chart-container")
        .node().offsetWidth;
    var height = 300;

    createMap(width, width * 4 / 5);
    createPie(width, height);
    createBar(width, height);
    drawMap(geoData, data, currentYear, currentDataType);
    drawPie(data, currentYear);
    drawBar(data, currentDataType, "");

    d3.select("#year")
        .property("min", currentYear)
        .property("max", extremeYears[1])
        .property("value", currentYear)
        .on("input", () => {
            currentYear = +this.event.target.value;
            drawMap(geoData, data, currentYear, currentDataType);
            drawPie(data, currentYear);
            highlightBars(currentYear);
        });

    d3.selectAll('input[name="data-type"]')
        .on("change", () => {
            var active = d3.select(".active").data()[0];
            var country = active ? active.properties.country : "";
            currentDataType = this.event.target.value;
            drawMap(geoData, data, currentYear, currentDataType);
            drawBar(data, currentDataType, country);
        });

    d3.selectAll("svg")
        .on("mousemove", updateTooltip);
}).catch(function (err){
    console.log(err);
})

function updateTooltip(event) {
    var tooltip = d3.select(".tooltip");
    var tgt = d3.select(event.target);
    var isCountry = tgt.classed("country");
    var isBar = tgt.classed("bar");
    var isArc = tgt.classed("arc");
    var dataType = d3.select("input:checked")
        .property("value");
    var units = dataType === "emissions" ? "thousand metric tons" : "metric tons per capita";
    var data;
    var percentage = "";
    if (isCountry) data = tgt.data()[0].properties;
    if (isArc) {
        data = tgt.data()[0].data;
        percentage = `<p>Percentage of total: ${getPercentage(tgt.data()[0])}</p>`;
    }
    if (isBar) data = tgt.data()[0];
    tooltip
        .style("opacity", +(isCountry || isArc || isBar))
        .style("left", (event.pageX - tooltip.node().offsetWidth / 2) + "px")
        .style("top", (event.pageY - tooltip.node().offsetHeight - 10) + "px");
    if (data) {
        var dataValue = data[dataType] ?
            data[dataType].toLocaleString() + " " + units :
            "Data Not Available";
        tooltip
            .html(`
              <p>Country: ${data.country}</p>
              <p>${formatDataType(dataType)}: ${dataValue}</p>
              <p>Year: ${data.year || d3.select("#year").property("value")}</p>
              ${percentage}
            `)
    }
}


function formatDataType(key) {
    return key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, c => " " + c);
}

function getPercentage(d) {
    var angle = d.endAngle - d.startAngle;
    var fraction = 100 * angle / (Math.PI * 2);
    return fraction.toFixed(2) + "%";
}


















