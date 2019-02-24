const margin = {left: 20, right: 20, top: 20, bottom: 20};

const width = 600 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;
const radius = width / 2;

// x scale is linear, from 0 to 2Pi (beause it's a circle)
const xScale = d3.scale.linear()
    .range([0, 2 * Math.PI]);

// y scale is from 0 to the radius
const yScale = d3.scale.linear()
    .range([0, radius]);

// select for the tooltip
const div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


var categors = ["Passengers", "1st Class", "2nd Class", "3rd Class", "Male", "Female", "died", "survived"]
var practicecolor = d3.scale.ordinal()
    .domain(categors)
    .range(["#1a9850", "#66bd63", "#a6d96a","#d9ef8b","#ffffbf","#fee08b","#fdae61","#f46d43"]);

var color = d3.scale.ordinal() // D3 Version 4
    .domain(["Passengers", "1st Class", "2nd Class", "3rd Class", "Male", "Female", "died", "survived"])
    .range(["#E74C3C", "#E67E22", "#F1C40F", "#27AE60", "#3498DB", "#8E44AD", "#FF33FC", "#76D7C4"]);

// format percentages
const formatNum = d3.format(",.2%");

// when on the full graph, total size is all the passengers
let totalSize = 891;

// the partition is the chunk of the graph
let partition = d3.layout.partition()
    .value(function (d) {
        return d.size;
    });

// append that beautiful canvas
const canvas = d3.select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

// arc will show the arcs of the graph
const arc = d3.svg.arc()
    .startAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, xScale(d.x)));
    })
    .endAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, xScale(d.x + d.dx)));
    })
    .innerRadius(function (d) {
        return Math.max(0, yScale(d.y));
    })
    .outerRadius(function (d) {
        return Math.max(0, yScale(d.y + d.dy));
    })

// load that data!
d3.json("data/titanic-passengers.json", function (data) {
    var graph = canvas.selectAll("path")
        .data(partition.nodes(data))
        .enter()
        .append("g");

    // adds text and formatting and such to the circle graph
    const path = graph.append("path")
        .attr("d", arc)

        .style("fill", function(d) { return practicecolor(d.name); })
        /*
        .style("fill", function (d, i) {
            return legendVals1(i)})
            */
        .style("stroke", "#000")
        .style("stroke-width", "2px")
        .on("click", zoom) //zoom function updates the graph
        .on("mouseover", function (d) { // tooltip!
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.name + "<br/> Size: " + d.size + "<br/> Percentage of Total: " + formatNum(d.size / totalSize))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })

    // add labels for each chunk of the graph
    // TODO: update so it doesn't display if it doesn't fit
    const text = graph.append("text")
        .attr("transform", function (d) {
            return "translate(" + arc.centroid(d) + ")";
        })
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(function (d) {
            return d.name;
        })
        .style("font-size", "16px")


    // zoom in on the section the user clicks on
    function zoom(d) {
        totalSize = parseInt(d.size); // the new size of the middle piece
        console.log(totalSize);
        text.transition().attr("opacity", 0); // remove the text while it moves
        // zoom in and see new subsection of graph
        path.transition()
            .duration(750)
            .attrTween("d", arcTween(d))
            .each("end", function (e, i) {
                if (e.x >= d.x && e.x < (d.x + d.dx)) {
                    const arcText = d3.select(this.parentNode).select("text");
                    arcText.transition().duration(750)
                        .attr("transform", function (d) {
                            return "translate(" + arc.centroid(d) + ")";
                        })
                        .attr("opacity", 1)
                }
            });
        // update the tooltip to show percentage of total and percentage of subsection selected
        path.on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.name + "<br/> Size: " + d.size + "<br/> Percentage of Total: " + formatNum((d.size / 891)) + "<br/> Percentage of Subsection: " + formatNum((d.size / totalSize)))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
    }

    // transitions any selected arcs from their current angle to the specified new angle.
    function arcTween(d) {
        const xd = d3.interpolate(xScale.domain(), [d.x, d.x + d.dx]);
        const yd = d3.interpolate(yScale.domain(), [d.y, 1]);
        const yr = d3.interpolate(yScale.range(), [d.y ? 20 : 0, radius]);
        return function (d, i) {
            return i ? function (t) {
                return arc(d);
            } : function (t) {
                xScale.domain(xd(t));
                yScale.domain(yd(t));
                yScale.range(yr(t));
                return arc(d);
            };
        };

    }

});

/*
const nah = d3.select("#legend")
    .append("svg")
    .attr("width", 500)
    .attr("height", 500)
    .append("g")

var legend = nah.append("g")

categors.forEach(function(continent, i){
    var legendRow = legend.append("g")
        .attr("transform", "translate(0, " + (i*20) + ")");
    legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d) {
            return data.color;
        });

    legendRow.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("text-transform", "capitalize")
        .text(continent);
})
*/
const nah = d3.select("#legend")
    .append("svg")
    .attr("width", 500)
    .attr("height", 500)
    .append("g")

var legend = nah.append("g")
    .selectAll("g")
    .data(practicecolor.domain())
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', function(d, i) {
        var height = 20;
        var x = 0;
        var y = i * height;
        return 'translate(' + x + ',' + y + ')';
    });

legend.append('rect')
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', practicecolor)
    .style('stroke', practicecolor);

legend.append('text')
    .attr('x', 20)
    .attr('y', 12)
    .text(function(d) { return d; });