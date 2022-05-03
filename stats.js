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

function generateMonths(data) {
    const MAPPING = {
        'Messages': 'messages',
        'Characters': 'sum_text_size',
        'Unique users': 'unique_users',
    }

    var flat_months = {};
    var skipped = false;
    for (const [year, value] of Object.entries(data['months'])) {
        for (const [i, month] of Object.entries(value)) {
            if (!skipped && month.messages === 0) continue;

            month.year = year;
            month.month = Number(i) + 1;
            flat_months[new Date(month.year, month.month)] = month;
            skipped = true;
        }
    }

    var DATA = d3.entries(flat_months);
    const MAX = d3.max(DATA, o => {return o.value.messages});

    var padding = 20;

    var width = 400;
    var height = 150;

    var totalWidth = width + padding * 2;
    var totalHeight = height + padding * 2;

    d3.select('#content')
    .append('h1')
    .attr('class', 'chart-title')
    .html(`<select id='type-select' class='dropdown rtl'>
        <option>Messages</option>
        <option>Characters</option>
        <option>Unique users</option>
    </select> per
    <select id='time-select' class='dropdown'>
        <option>month</option>
        <option>year</option>
    </selectt>`);

    var svg = d3.select('#content')
    .append('svg')
    .attr('id', 'chart-months')
    .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    shortDate = d3.timeFormat('%b \'%y');
    shortNumber = d3.format(',');
    tip = d3.tip().offset([-10, 0]);
    svg.call(tip)

    svg.selectAll('rect')
    .data(DATA)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .on('mouseout', tip.hide);

    var xAxis = d3.axisBottom()
    .tickSizeOuter(0)
    .tickSizeInner(2);

    svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0, ' + height + ')')

    var yScale = d3.scaleLinear().range([0, height]);
    var yAxis = d3.axisLeft().scale(yScale)

    d3.select('#type-select')
    .on('change', updateToSelection);

    d3.select('#time-select')
    .on('change', function() {
        var selected = d3.select('#time-select').property('value');
        if (selected === 'month')
            updateToMonths();
        else if (selected === 'year')
            updateToYears();
    });

    updateToMonths();

    function getSelectedType() {
        return MAPPING[d3.select('#type-select').property('value')];
    }

    function updateToMonths() {
        DATA = d3.entries(flat_months);

        svg.selectAll('rect')
        .data(DATA)
        .enter()
        .append('rect')
        .attr('class', 'bar')

        svg.selectAll('rect')
        .attr('width', function (b, i) {return width / DATA.length - 0.5})
        .attr('x', function (b, i) {return i * (width / DATA.length)})
        .on('mouseover', tip.show);

        var xScale = d3.scaleTime()
        .domain([
            new Date(DATA[0].value.year, DATA[0].value.month-1),
            new Date(DATA[DATA.length-1].value.year, DATA[DATA.length-1].value.month-1)
        ])
        .range([-0.5, width - 1]);
        svg.select('.x-axis').call(xAxis.scale(xScale));

        svg.selectAll('.bar-label').remove();

        updateToSelection();
    }

    function updateToYears() {
        DATA = d3.entries(data['years']);

        svg.selectAll('rect').data(DATA).exit().remove();

        svg.selectAll('rect')
        .attr('width', function (b, i) {return width / DATA.length - 0.5})
        .attr('x', function (b, i) {return i * (width / DATA.length)})
        .on('mouseover', tip.hide);

        xScale = d3.scaleBand()
        .domain(d3.range(
            Number(d3.min(DATA, function (b) {return b.key})),
            Number(d3.max(DATA, function (b) {return b.key})) + 1
        ))
        .range([-0.5, width - 1]);
        svg.select('.x-axis').call(xAxis.scale(xScale));

        svg.selectAll('.bar-label')
        .data(DATA)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', function(b, i) {return xScale(b.key) + xScale.bandwidth()/2 + 0.5})
        .text(function (b) {return d3.format(',')(b.value[getSelectedType()])});

        updateToSelection();
    }

    function updateToSelection() {
        var selected = MAPPING[d3.select('#type-select').property('value')];
        updateTo(selected);
    }

    function updateTo(type) {
        const MAX = d3.max(DATA, o => {return o.value[type]});
        yScale.domain([0, d3.max(DATA, function(b) {return b.value[getSelectedType()]})])
        d3.selectAll('#chart-months rect')
        .transition()
        .attr('height', function (b, i) {return (b.value[type] / MAX) * height})
        .attr('y', function (b, i) {return height - (b.value[type] / MAX) * height})

        tip.attr('class', 'd3-tip').html(function (b) {return shortDate(new Date(b.value.year, b.value.month-1)) + '<br/>' + shortNumber(b.value[type])})

        svg.selectAll('.bar-label')
        .data(DATA)
        .transition()
        .attr('y', function(b, i) {return height - yScale(b.value[type]) + 5})
        .text(function (b) {return d3.format(',')(b.value[type])});
    }
}

function generateUsers(data) {
    const MAPPING = {
        'Messages': 'messages',
        'Characters': 'sum_text_size',
        'Active days': 'days_active',
        'uwus': 'uwus',
    }

    var USERS = d3.entries(data['users']);
    USERS.sort(function (x, y) {
            return d3.descending(x.value.messages, y.value.messages);
        });
    const MAX = d3.max(USERS, o => {return o.value.messages});

    var padding = 20;
    var leftPadding = 55;

    var width = 400;
    var height = 1200;

    var totalWidth = width + padding * 2 + leftPadding;
    var totalHeight = height + padding * 2;

    d3.select('#content')
    .append('h1')
    .attr('class', 'chart-title')
    .html(`<select id='user-type-select' class='dropdown rtl'>
        <option>Messages</option>
        <option>Characters</option>
        <option>Active days</option>
        <option>uwus</option>
    </select> per user`);

    var svg = d3.select('#content')
    .append('svg')
    .attr('id', 'chart-users')
    .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    shortDate = d3.timeFormat('%b \'%y');
    shortNumber = d3.format(',');
    tip = d3.tip().offset([-10, 0]);
    svg.call(tip)

    svg.selectAll('rect')
    .data(USERS)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('height', function (b, i) {return height / USERS.length - 0.5})
    .attr('x', function(b, i) {return leftPadding;})
    .attr('y', function (b, i) {return i * (height / USERS.length)})
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

    svg.selectAll('bar')
    .data(USERS)
    .enter()
    .append('text')
    .attr('class', 'user-label')
    .attr('x', function (b, i) {return leftPadding - 5; })
    .attr('y', function (b, i) {return i * (height / USERS.length) + 4})
    .attr('text-anchor', 'end');

    svg.selectAll('bar')
    .data(USERS)
    .enter()
    .append('text')
    .attr('class', 'hor-bar-label')
    .attr('x', function (b, i) {return leftPadding - 5; })
    .attr('y', function (b, i) {return i * (height / USERS.length) + 4.5})
    .attr('text-anchor', 'start');


    var xAxis = d3.axisBottom()
    .tickSizeOuter(0)
    .tickSizeInner(2)
    .tickFormat(d3.format('~s'));

    svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', 'translate(0, ' + height + ')')

    var yScale = d3.scaleBand().range([0, height]);
    var yAxis = d3.axisLeft().scale(yScale)

    d3.select('#user-type-select')
    .on('change', updateToSelection);

    updateToSelection();

    function getSelectedType() {
        return MAPPING[d3.select('#user-type-select').property('value')];
    }

    function updateToSelection() {
        var selected = MAPPING[d3.select('#user-type-select').property('value')];
        updateTo(selected);
    }

    function updateTo(type) {
        USERS.sort(function (x, y) {
            return d3.descending(x.value[type], y.value[type]);
        });
        const MAX = d3.max(USERS, o => {return o.value[type]});

        var xScale = d3.scaleLinear()
        .domain([USERS[USERS.length-1].value[type], USERS[0].value[type]])
        .range([leftPadding - 0.5, width - 1]);
        svg.select('.x-axis').call(xAxis.scale(xScale));

        yScale.domain([0, d3.max(USERS, function(b) {return b.value[getSelectedType()]})])

        svg.selectAll('#chart-users .user-label')
        .data(USERS)
        .style("opacity", 0)
        .text(function (b) {return b.key})
        .transition()
        .style("opacity", 1)
        .transition()
        .delay(1500)

        svg.selectAll('#chart-users .hor-bar-label')
        .data(USERS)
        .style("opacity", 0)
        .text(function (b) {return d3.format(',')(b.value[type])})
        .attr('x', function (b, i) {return (b.value[type] / MAX) * width + leftPadding + 2; })
        .transition()
        .style("opacity", 1)
        .transition()
        .delay(1500);

        d3.selectAll('#chart-users rect')
        .data(USERS)
        .transition()
        .attr('width', function (b, i) {return (b.value[type] / MAX) * width})

        tip.attr('class', 'd3-tip').html(function (b) {return b.key + '<br/>' + shortNumber(b.value[type])})
    }
}

function main(data) {
    generateIntro(data);
    generateMonths(data);
    generateHours(data);
    generateUsers(data);
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