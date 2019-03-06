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

const categors = ["All Passengers", "1st Class", "2nd Class", "3rd Class", "Male", "Female", "died", "survived"]
const practicecolor = d3.scale.ordinal()
    .domain(categors)
    .range(["#ffffe5", "#003EE5", "#bbffff", "#00BFFF", "#3cb371", "#BAE314", "#FFF614", "#fec44f"]);

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

    // zoom in on the section the user clicks on
    function zoom(d) {
        totalSize = parseInt(d.size); // the new size of the middle piece
        console.log(totalSize);
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


const all = d3.select("#total")
    .append("svg")
    .attr("width", 500)
    .attr("height", 500)
    .append("g")

function viewLegend(){
    var total = ["All Passengers - 891", "1st Class - 216", "2nd Class - 184", "Third Class - 491",  "Male - 577", "Female - 314",  "Died - 549", "Survived - 342"]
    const allpassengers = d3.scale.ordinal()
        .domain(total)
        .range(["#ffffe5", "#003EE5", "#bbffff", "#00BFFF", "#3cb371", "#BAE314", "#FFF614", "#fec44f"]);


    all.append("text")
        .text("Legend")
        .attr('x', 75)
        .attr('y', 175)
        .style('text-anchor', 'middle')
        .style('fill', 'red')
        .style('font-size', '20px')
        .style('font-family', 'sans-serif')

    var totals = all.append("g")
        .selectAll("g")
        .data(allpassengers.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
            var height = 15;
            var x = 10;
            var y = i * height+200;
            return 'translate(' + x + ',' + y + ')';
        });

    totals.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .style('fill', allpassengers)
        .style('stroke', "black");

    totals.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(function(d) { return d; })
        .style('font-family', 'sans-serif');

}
