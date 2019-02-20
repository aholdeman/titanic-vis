const margin = {left: 20, right: 20, top: 20, bottom: 20};

const width = 700 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;
const radius = width / 2;

const xScale = d3.scale.linear()
    .range([0, 2 * Math.PI]);

const yScale = d3.scale.linear()
    .range([0, radius]);

let partition = d3.layout.partition()
    .value(function (d) {
        return d.size;
    });

const canvas = d3.select("#chart-area")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + (width/2) + "," + (height/2)+ ")");

const arc = d3.svg.arc()
    .startAngle(function(d) {
        return Math.max(0, Math.min(2*Math.PI, xScale(d.x)));
    })
.endAngle(function(d) {
    return Math.max(0, Math.min(2*Math.PI, xScale(d.x + d.dx)));
})
.innerRadius(function(d) {
    return Math.max(0, yScale(d.y));
})
.outerRadius(function(d) {
    return Math.max(0, yScale(d.y + d.dy));
})

d3.json("data/sources.json", function(data) {
    const graph = canvas.selectAll("path")
        .data(partition.nodes(data))
        .enter()
        .append("g");

    const path = graph.append("path")
        .attr("d", arc)
        .style("fill", function(d) {
            return d.color;
        })
        .style("stroke", "black")
        .style("stroke-width", "2px")
        .on("click", click)

    const text = graph.append("text")
        .attr("text-anchor", "middle")
        .attr("dx", "0")
        .attr("dy", ".35em")
        .text(function(d){ return d.name; })


    function click(d) {
        path.transition()
            .duration(750)
            .attrTween("d", arcTween(d))
            .each("end", function(e,i) {
                if (e.x >= d.x && e.x < (d.x + d.dx)) {
                    const arcText =d3.select(this.parentNode).select("text");
                    arcText.transition().duration(750)
                }
            });
    }
});

d3.select(self.frameElement).style("height", height + "px");

function arcTween(d) {
    const xd = d3.interpolate(xScale.domain(), [d.x, d.x + d.dx]);
    const yd = d3.interpolate(yScale.domain(), [d.y, 1]);
    const yr = d3.interpolate(yScale.range(), [d.y ? 20 : 0, radius]);
    return function(d, i) {
        return i ? function(t) {
            return arc(d);
        } : function(t) {
            xScale.domain(xd(t));
            yScale.domain(yd(t)).range(yr(t));
            return arc(d);
        };
    };

}
