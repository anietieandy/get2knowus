// test with dummy data
function generateData() {
    var _data = [];

    // generate data
    _.times(_.random(30, 50), function (n) {
        _data.push({
            s: _.random(44, 2000), // size/area of bubble
            x: _.random(0, 100),
            y: _.random(0, 100)
        });
    });

    return _data;
}

function makeChart(dataset) {

    var min_amount = 0;
    var max_amount = 0;

    var min_freq = 0;
    var max_freq = 0;

    var log_s_constant = 100.0;
    var x_constant = 1.0
    var y_constant = 1.0

    var data = [];


    for (var i = 0; i < dataset.length; i++) {
        if (i > dataset.length * 0.9 || i < dataset.length * 0.1) {
            if (dataset[i][1] < min_amount) {
                min_amount = dataset[i][1];
            }
            if (dataset[i][1] > max_amount) {
                max_amount = dataset[i][1];
            }
            if (dataset[i][2] < min_freq) {
                min_freq = dataset[i][2];
            }
            if (dataset[i][2] > max_freq) {
                max_freq = dataset[i][2];
            }
            data.push({
                s: Math.floor(Math.abs(dataset[i][1] * log_s_constant)),
                x: Math.floor(dataset[i][1] * x_constant),
                y: Math.floor(dataset[i][2] * y_constant),
                text: dataset[i][0]
            });            
        }
    }

    var size = d3.scale.linear().range([Math.floor(min_amount * log_s_constant), Math.floor(max_amount * log_s_constant)]).domain(fc.util.extent().fields(['s'])(data));

    // create a chart with two linear axes
    var chart = fc.chart.cartesian(d3.scale.linear(), d3.scale.linear()).xDomain(fc.util.extent().pad(0.4).fields(['x'])(data)).xLabel('Log-Odds (Scaled)').xBaseline(0).yDomain(fc.util.extent().pad(0.4).fields(['y'])(data)).yOrient('left').yBaseline(0).yTicks(7).yLabel('Word Frequency').margin({ bottom: 20, right: 15, left: 25 });

    // create the point series
    var point = fc.series.point().size(function (d) {
        setTimeout(function() {console.log(d)}, 500);
        if (size(d.s) < 100) {
            return 100;
        } else {
            return size(d.s);
        }
    }).xValue(function (d) {
        console.log(d);
        return d.x;
    }).yValue(function (d) {
        return d.y;
    }).decorate(function (s) {
        s.attr('d', function (d) {
            if (d.x >= (max_amount * x_constant / 200.0) && d.y >= (max_freq * y_constant / 2.0)) {
                d3.select(this).style({
                    fill: 'orange',
                    'fill-opacity': 1.0,
                    stroke: 'orange'
                });
            } else if (d.x <= (max_amount * x_constant / 200.0) && d.y >= (max_freq * y_constant / 2.0)) {
                d3.select(this).style({
                    fill: 'orange',
                    'fill-opacity': 0.5,
                    stroke: 'orange'
                });
            } else if (d.x < (max_amount * x_constant / 200.0) && d.y < (max_freq * y_constant / 2.0)) {
                d3.select(this).style({
                    fill: 'orange',
                    'fill-opacity': 0.2,
                    stroke: 'orange'
                });
            } else if (d.x > (max_amount * x_constant / 200.0) && d.y < (max_freq * y_constant / 2.0)) {
                d3.select(this).style({
                    fill: 'orange',
                    'fill-opacity': 0.5,
                    stroke: 'orange'
                });
            }
        });
    });

    var text = d3.select("#vis").data(data).enter().append("text");

    var textLabels = text.attr("x", function(d) { return d.x; })
                         .attr("y", function(d) { return d.y; })
                         .text(function(d) { return d.text; })
                         .attr("font-family", "sans-serif")
                         .attr("font-size", "20px");

    var gridlines = fc.annotation.gridline();

    // add it to the chart
    var multi = fc.series.multi().series([gridlines, point, text]);

    chart.plotArea(multi);

    function render() {
        d3.select('#vis').datum(data).call(chart);
    }
    render();
}