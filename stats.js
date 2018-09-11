function generateHours(data) {
    const HOURS = data['hours'];
    const MAX_HOUR = d3.max(HOURS, o => {return o.messages});

    var padding = 20;

    var width = 400;
    var height = 150;

    var totalWidth = width + padding * 2;
    var totalHeight = height + padding * 2;

    d3.select('#content')
    .append('h1')
    .attr('class', 'chart-title')
    .text('Messages per hour (UTC-05:00)');

    var svg = d3.select('#content')
    .append('svg')
    .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    svg.selectAll('rect')
    .data(HOURS)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('width', function (b, i) {return width / HOURS.length - 0.5})
    .attr('height', function (b, i) {return (b.messages / MAX_HOUR) * height})
    .attr('x', function (b, i) {return i * (width / HOURS.length)})
    .attr('y', function (b, i) {return height - (b.messages / MAX_HOUR) * height});

    var xScale = d3.scaleBand()
    .domain(d3.range(0, HOURS.length))
    .range([-0.5, width - 1]);
    var xAxis = d3.axisBottom()
    .scale(xScale)
    .tickSizeOuter(0)
    .tickSizeInner(2);

    svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);

    var yScale = d3.scaleLinear()
    .domain([0, d3.max(HOURS, function(b) {return b.messages})])
    .range([0, height]);
    var yAxis = d3.axisLeft()
    .scale(yScale)

    svg.selectAll('.bar-label')
    .data(HOURS)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', function(b, i) {return xScale(i) + xScale.bandwidth()/2 + 0.5})
    .attr('y', function(b, i) {return height - yScale(b.messages) + 5})
    .text(function (b) {return d3.format(',')(b.messages);})
}

function generateMonths() {
    var xScale = d3.scale()
    .domain([new Date(), new Date()])
}

function main(data) {
    generateHours(data);
}

var request = new XMLHttpRequest();
request.open('GET', 'https://mismeasu.red/chatic/tfwiki.json');
request.responseType = 'json';
request.onload = function(e) {
    if (this.status == 200) {
        main(this.response);
    }
}
request.send();