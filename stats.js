function generateIntro(data) {
    d3.select('#content')
    .append('div')
    .attr('class', 'stat-intro')
    .html(`Statistics for <code>#tfwiki</code> from <em>${data['timespan'][0]}</em> to <em>${data['timespan'][1]}</em>.<br>
    <strong>${d3.format(',')(data['messages'])}</strong> messages from <strong>${d3.format(',')(data['unique_users'])}</strong> unique users totalling <strong>${d3.format(',')(data['sum_text_size'])}</strong> characters.`)
}

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
    .attr('class', 'chart-hours')
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

function generateYears(data) {
    const YEARS = d3.entries(data['years']);
    const MAX_YEAR = d3.max(YEARS, o => {return o.value.messages});

    var padding = 20;

    var width = 400;
    var height = 150;

    var totalWidth = width + padding * 2;
    var totalHeight = height + padding * 2;

    d3.select('#content')
    .append('h1')
    .attr('class', 'chart-title')
    .text('Messages per year');

    var svg = d3.select('#content')
    .append('svg')
    .attr('class', 'chart-years')
    .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    svg.selectAll('rect')
    .data(YEARS)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('width', function (b, i) {return width / YEARS.length - 0.5})
    .attr('height', function (b, i) {return (b.value.messages / MAX_YEAR) * height})
    .attr('x', function (b, i) {return i * (width / YEARS.length)})
    .attr('y', function (b, i) {return height - (b.value.messages / MAX_YEAR) * height});

    var xScale = d3.scaleBand()
    .domain(d3.range(
        Number(d3.min(YEARS, function (b) {return b.key})),
        Number(d3.max(YEARS, function (b) {return b.key})) + 1
    ))
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
    .domain([0, d3.max(YEARS, function(b) {return b.value.messages})])
    .range([0, height]);
    var yAxis = d3.axisLeft()
    .scale(yScale)

    svg.selectAll('.bar-label')
    .data(YEARS)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', function(b, i) {return xScale(b.key) + xScale.bandwidth()/2 + 0.5})
    .attr('y', function(b, i) {return height - yScale(b.value.messages) + 5})
    .text(function (b) {return d3.format(',')(b.value.messages);})
}

function generateMonths(data) {
    var MONTHS = [];
    var skipped = false;
    for (const [year, value] of Object.entries(data['months'])) {
        for (const [i, month] of Object.entries(value)) {
            if (!skipped && month.messages === 0) continue;

            month.year = year;
            month.month = Number(i) + 1;
            MONTHS.push(month);
            skipped = true;
        }
    }
    const MAX_MONTH = d3.max(MONTHS, o => {return o.messages});

    var padding = 20;

    var width = 400;
    var height = 150;

    var totalWidth = width + padding * 2;
    var totalHeight = height + padding * 2;

    d3.select('#content')
    .append('h1')
    .attr('class', 'chart-title')
    .text('Messages per month');

    var svg = d3.select('#content')
    .append('svg')
    .attr('class', 'chart-months')
    .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    shortDate = d3.timeFormat('%b \'%y');
    tip = d3.tip()
    .attr('class', 'd3-tip').html(function (b) {
        return shortDate(new Date(b.year, b.month-1)) + '<br/>' + b.messages
    })
    .offset([-10, 0]);
    svg.call(tip)

    svg.selectAll('rect')
    .data(MONTHS)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('width', function (b, i) {return width / MONTHS.length - 0.5})
    .attr('height', function (b, i) {return (b.messages / MAX_MONTH) * height})
    .attr('x', function (b, i) {return i * (width / MONTHS.length)})
    .attr('y', function (b, i) {return height - (b.messages / MAX_MONTH) * height})
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

    var xScale = d3.scaleTime()
    .domain([
        new Date(MONTHS[0].year, MONTHS[0].month-1),
        new Date(MONTHS[MONTHS.length-1].year, MONTHS[MONTHS.length-1].month-1)
    ])
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
    .domain([0, MAX_MONTH])
    .range([0, height]);
    var yAxis = d3.axisLeft()
    .scale(yScale)
}

function main(data) {
    generateIntro(data);
    generateMonths(data);
    generateYears(data);
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