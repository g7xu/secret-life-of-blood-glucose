// Tooltip setup
let tooltipDiv = document.createElement("div");
tooltipDiv.className = "tooltip";
tooltipDiv.style.position = "absolute";
tooltipDiv.style.backgroundColor = "white";
tooltipDiv.style.border = "1px solid black";
tooltipDiv.style.borderRadius = "5px";
tooltipDiv.style.padding = "10px";
tooltipDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
tooltipDiv.style.zIndex = "1000";
tooltipDiv.style.display = "none";
document.body.appendChild(tooltipDiv);

// Load data function
async function loadData() {
    try {
        const [cgMacrosData, bioData] = await Promise.all([
            d3.json('assets/vis_data/CGMacros.json'),
            d3.json('assets/vis_data/bio.json')
        ]);

        const bioMap = new Map(bioData.map(d => [d.PID, d['diabetes level']]));

        function parseTimestamp(timestamp) {
            const match = timestamp.match(/(\d+) days (\d+):(\d+):(\d+)/);
            if (!match) return null;
            const [, days, hours, minutes, seconds] = match.map(Number);
            return days * 24 * 60 + hours * 60 + minutes + seconds / 60;
        }

        return [...new Set(cgMacrosData.map(d => d.PID))].map(pid => {
            const values = cgMacrosData
                .filter(d => d.PID === pid)
                .map(d => ({
                    time: parseTimestamp(d.Timestamp),
                    glucose: +d['Libre GL'],
                    pid: d.PID
                }))
                .filter(d => d.time !== null)
                .sort((a, b) => a.time - b.time);

            return { pid, values, diabetic_level: bioMap.get(pid) };
        });
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

//helper function to format the timestamp

// Get color for group
function getColorForGroup(group) {
    const colors = {
        "Non-diabetic": "#00bfae",  // Teal
        "Pre-diabetic": "#fac127",  // Yellow
        "Diabetic": "#fb6900"       // Orange
    };
    return colors[group] || "#000000"; // Default to black if no match
}


// Load and create charts
async function loadDataAndCreateCharts() {
    // load in the data
    const data = await loadData();
    if (!data || data.length === 0) {
        console.error("No glucose data loaded!");
        return;
    }

    const groups = {
        "Non-diabetic": {},
        "Pre-diabetic": {},
        "Diabetic": {}
    };

    data.forEach(({ pid, values, diabetic_level }) => {
        if (!groups[diabetic_level][pid]) {
            groups[diabetic_level][pid] = [];
        }
        groups[diabetic_level][pid] = values;
    });

    const charts = [];

    let globalMin = Infinity;
    let globalMax = -Infinity;

    data.forEach(({ values }) => {
        values.forEach(({ glucose }) => {
            globalMin = Math.min(globalMin, glucose);
            globalMax = Math.max(globalMax, glucose);
        });
    });

    const globalYScale = d3.scaleLinear()
        .domain([globalMin, globalMax])
        .range([100 - 5, 5]);



    Object.entries(groups).forEach(([group, participants]) => {
        const container = d3.select(`#${group.replace(" ", "-").toLowerCase()}-vis`)
            .style('position', 'relative'); // Ensure the container has relative positioning


        Object.entries(participants).forEach(([pid, entries]) => {
            const participantDiv = container.append("div")
                .attr("class", "participant-section")
                .style("display", "flex")
                .style("width", `calc(20% - 10px)`) // 20% width minus padding
                .style('height', `100%`)
                .style('padding', '5px')
                .style('position', 'relative'); // Add relative positioning

            const color = getColorForGroup(group);
            const chart = createGlucoseLineChart(participantDiv, entries, color, globalYScale);
            charts.push(chart);
        });
    });

    setTimeout(function() {
        charts.forEach(chart => chart.update());
    }, 300);
}

// Create glucose line chart
function createGlucoseLineChart(container, data, groupColor, yScale) {
    // define helper function
    function formatTime(index) {
        const totalMinutes = index * minutesPerReading;
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const mins = totalMinutes % 60;
        const day = Math.floor(totalMinutes / 1440);

        return `Day ${day}`;
    }

    function getTickCount(width) {
        if (width < 100) return 3;
        if (width < 200) return 4;
        if (width < 300) return 5;
        return 5;
    }

    function updateChart() {
        width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        width = Math.max(width, 150);

        clipPath.attr("width", width);

        xScale.range([0, width])
            .domain([startTime, startTime + windowSize]);

        const tickCount = getTickCount(width);

        xAxisGroup.call(d3.axisBottom(xScale)
            .ticks(tickCount)
            .tickFormat(d => formatTime(d)));

        xAxisGroup.selectAll("text")
            .attr("dy", "1em")
            .attr("transform", "rotate(-25)")
            .style("text-anchor", "end");

        yAxisGroup.call(d3.axisLeft(yScale).ticks(5));

        yGrid.selectAll("line").remove();
        yGrid.selectAll("line")
            .data(yScale.ticks(5))
            .enter()
            .append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", d => yScale(d))
            .attr("y2", d => yScale(d))
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");

        updateXGrid(tickCount);

        const visibleData = data.slice(startTime, startTime + windowSize);
        path.datum(visibleData).attr("d", line);

        const midIndex = Math.floor(windowSize / 2);
        if (midIndex < visibleData.length) {
            dot.attr("cx", xScale(startTime + midIndex))
                .attr("cy", yScale(visibleData[midIndex].glucose));
        }
    }

    function updateXGrid(tickCount) {
        xGrid.selectAll("line").remove();

        xGrid.selectAll("line")
            .data(xScale.ticks(tickCount))
            .enter()
            .append("line")
            .attr("x1", d => xScale(d))
            .attr("x2", d => xScale(d))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");
    }

    function animate() {
        if (!animationRunning) return;

        startTime += 1;
        if (startTime + windowSize >= data.length) {
            startTime = 0;
        }

        xScale.domain([startTime, startTime + windowSize]);

        const tickCount = getTickCount(width);

        xAxisGroup.call(d3.axisBottom(xScale)
            .ticks(tickCount)
            .tickFormat(d => formatTime(d)));

        xAxisGroup.selectAll("text")
            .attr("dy", "1em")
            .attr("transform", "rotate(-25)")
            .style("text-anchor", "end");

        updateXGrid(tickCount);

        const visibleData = data.slice(startTime, startTime + windowSize);
        path.datum(visibleData).attr("d", line);

        const midIndex = Math.floor(windowSize / 2);
        if (midIndex < visibleData.length) {
            dot.attr("cx", xScale(startTime + midIndex))
                .attr("cy", yScale(visibleData[midIndex].glucose));
        }

        setTimeout(animate, 20);
    }

    const margin = { top: 10, right: 10, bottom: 40, left: 50 };
    const svg = container.append("svg")
        .attr('class', 'rolling_glucose_svg')
        .attr("width", `100%`)
        .attr("height", `100%`)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // find the width and the height of the svg
    let width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    let height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;
    width = Math.max(width, 150); // ensure minimum width
    height = Math.max(height, 150); // ensure minimum height

    // the glucose line
    const clipPath = svg.append("defs").append("clipPath")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    const chartGroup = svg.append("g")
        .attr('width', width)
        .attr('height', height);

    let startTime = 0;
    const windowSize = 100;
    const minutesPerReading = 15;


    const xScale = d3.scaleLinear()
        .range([10, width-10]);

    yScale = d3.scaleLinear()
        .domain([50, 350])
        .range([height * 0.8, 10]); // Inverted scale for y-axis

    const yGrid = svg.append("g")
        .attr("class", "y-grid");

    const xGrid = chartGroup.append("g")
        .attr("class", "x-grid");

    const line = d3.line()
        .x((d, i) => xScale(startTime + i))
        .y(d => yScale(d.glucose));

    const path = chartGroup.append("path")
        .attr("class", "glucose-line")
        .attr("stroke", groupColor)
        .attr("fill", "none")
        .attr("stroke-width", 2);

    const dot = chartGroup.append("circle")
        .attr("r", 5)
        .attr("fill", "red");

    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height * 0.8})`);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis");

    let animationRunning = false;

    requestAnimationFrame(function() {
        setTimeout(function() {
            updateChart();

            animationRunning = true;
            animate();
        }, 100);
    });

    const resizeHandler = function() {
        updateChart();
    };

    window.addEventListener('resize', resizeHandler);

    return {
        update: updateChart,
        cleanup: function() {
            window.removeEventListener('resize', resizeHandler);
            animationRunning = false;
        }
    };
}

// Load data and create charts on DOMContentLoaded
document.addEventListener("DOMContentLoaded", loadDataAndCreateCharts);
