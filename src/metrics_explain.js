import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Set up container dimensions and margins
const margin = { top: 50, right: 50, bottom: 50, left: 100 };
const rowHeight = 500; // Height for each individual row
const plotGap = 20; // Gap between plots

// Data structure to hold our data
const dataFiles = {
    bioData: '../assets/vis_data/bio.json',
    cgmData: '../assets/vis_data/CGMacros.json',
    mealData: '../assets/vis_data/meal_data.json'
};

// Function to fetch data
async function fetchData() {
    try {
        console.log("Fetching data...");

        const [bioData, cgmData, mealData] = await Promise.all([
            d3.json(dataFiles.bioData),
            d3.json(dataFiles.cgmData),
            d3.json(dataFiles.mealData)
        ]);

        // Filter for non-diabetic participants only
        const nonDiabeticParticipants = bioData.filter(p => p["diabetes level"] === "Non-diabetic");

        return { nonDiabeticParticipants, cgmData, mealData };
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

function plotData(nonDiabeticParticipants, cgmData, mealData) {
    // Count data points by PID to see what we have
    const pidCounts = {};
    cgmData.forEach(d => {
        if (!pidCounts[d.PID]) pidCounts[d.PID] = 0;
        pidCounts[d.PID]++;
    });
    console.log("Data points by PID:", pidCounts);

    // Find which non-diabetic participants have data
    const pidsWithData = Object.keys(pidCounts).map(pid => Number(pid));
    const nonDiabeticPidsWithData = nonDiabeticParticipants
        .filter(p => pidsWithData.includes(p.PID))
        .map(p => p.PID);

    // Select the first non-diabetic participants for demonstration
    let selectedPIDs = nonDiabeticPidsWithData.slice(0, 1);

    // Calculate total SVG height based on number of participants
    const totalHeight = (selectedPIDs.length * (rowHeight + plotGap)) - plotGap + margin.top + margin.bottom;

    // Let the width and height be dynamic based on the container size
    const container = document.getElementById("explain_graph");
    console.log("Container dimensions:", container.clientWidth, container.clientHeight);

    const svgWidth = container.clientWidth;
    const svgHeight = container.clientHeight;

    // Append the SVG object to the specific HTML element (.graph-wrapper4)
    const svg = d3.select('#explain_graph')
        .append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process the timestamp to extract hours and minutes, only include time before 12PM
    const parseTime = (timestamp) => {
        try {
            let timeParts;
            if (timestamp.includes(":")) {
                if (timestamp.split(" ").length >= 3) {
                    timeParts = timestamp.split(" ")[2].split(":");
                } else {
                    timeParts = timestamp.split(" ").find(part => part.includes(":")).split(":");
                }
                const hours = parseInt(timeParts[0]);
                const minutes = parseInt(timeParts[1]);
                const decimalHours = hours + minutes / 60; // Convert to decimal hours
                return decimalHours < 12 ? decimalHours : null; // Only include time before 12PM
            } else {
                console.warn("No time format found in timestamp:", timestamp);
                return null;
            }
        } catch (error) {
            console.error("Error parsing timestamp:", timestamp, error);
            return null;
        }
    };

    // Set up the x scale (shared across all plots)
    const x = d3.scaleLinear()
        .domain([0, 14]) // 24 hours in a day
        .range([0, svgWidth]);

    // Add the shared x-axis at the bottom with some margin
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${svgHeight - margin.bottom - margin.top})`)
        .call(d3.axisBottom(x)
            .ticks(12)
            .tickFormat(d => {
                if (d === 0 || d === 24) return "12AM";
                if (d === 12) return "12PM";
                return d < 12 ? `${d}AM` : `${d - 12}PM`;
            }));

    // Add title for the entire visualization
    svg.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Day 1 Glucose Levels for Non-Diabetic Participants");

    // Process and create each participant's plot
    let maxGlucoseValue = 0; // To store the max glucose value across all participants
    const participantData = [];

    // First pass to collect all data and find the max glucose value
    selectedPIDs.forEach(pid => {
        const participantDayData = cgmData.filter(d =>
            String(d.PID) === String(pid) &&
            (d.Timestamp.startsWith("1 days") || d.Timestamp.startsWith("1 day") || d.Timestamp.includes("Day 1"))
        );

        const processedData = participantDayData.map(d => ({
            time: parseTime(d.Timestamp),
            value: d["Libre GL"] || 0
        })).filter(d => d.value > 0);

        if (processedData.length > 0) {
            const participantMax = d3.max(processedData, d => d.value);
            if (participantMax > maxGlucoseValue) {
                maxGlucoseValue = participantMax;
            }

            const participant = nonDiabeticParticipants.find(p => p.PID === pid);

            participantData.push({
                pid,
                name: `PID ${pid}`,
                age: participant ? participant.Age : "Unknown",
                gender: participant ? participant.Gender : "Unknown",
                data: processedData
            });
        }
    });

    console.log("Participant data:", participantData);
    console.log("Max glucose value:", maxGlucoseValue);

    // Plot the y-axis
    const y = d3.scaleLinear()
        .domain([0, maxGlucoseValue * 1.1]) // Add 10% padding to the max glucose value
        .range([rowHeight, 0]);

    // Add y-axis to the left side
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5));

    // Plot the horizontal grid lines
    for (let i = 0; i <= maxGlucoseValue * 1.1; i += 20) {
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", svgWidth)
            .attr("y1", y(i))
            .attr("y2", y(i))
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
    }

    // Adding y-axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 0) // Adjusted for margin
        .attr("dy", "-2.5em")
        .attr("transform", "rotate(-90)")
        .style("font-size", "12px") // Make the text smaller
        .text("Glucose Level (mg/dL)");

    // Plot the change of glucose as a line plot for the only participant
    let onlyParticipant = participantData[0];


    // Plot the line for the only participant
    svg.append("path")
        .datum(onlyParticipant.data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => x(d.time))
            .y(d => y(d.value))
            .curve(d3.curveMonotoneX));

    // Query the meal data for the only participant
    const mealForParticipant = mealData.filter(d => 
        String(d.PID) === String(onlyParticipant.pid) &&
        (d.Timestamp.startsWith("1 days") || d.Timestamp.startsWith("1 day") || d.Timestamp.includes("Day 1")) &&
        (d["Meal Type"] === "breakfast" || d["Meal Type"] === "lunch")
    );
    
    // ploting the meal data as dot in the visualization
    mealForParticipant.forEach(d => {
        const mealTime = parseTime(d.Timestamp);
        const mealValue = d['Libre GL']; // Positioning for breakfast and lunch
        // svg.append("circle")
        //     .attr("cx", x(mealTime))
        //     .attr("cy", y(mealValue))
        //     .attr("r", 5)
        //     .attr("fill", d["Meal Type"] === "breakfast" ? "red" : "red") // Both colors set to red
        //     .append("title") // Tooltip for meal type
        //     .text(`Meal: ${d["Meal Type"]}`);
    });

    let breakfast_startTime = parseTime(mealForParticipant.find(d => d["Meal Type"] === "breakfast").Timestamp);
    let lunch_startTime = parseTime(mealForParticipant.find(d => d["Meal Type"] === "lunch").Timestamp);

    let breakfast_start_glucose_value = onlyParticipant.data
        .find(d => d.time === breakfast_startTime).value;
    let lunch_start_glucose_value = onlyParticipant.data
        .find(d => d.time === lunch_startTime).value;

    // Calculate the glucose excursion time for breakfast which is the time where the glcuose level reach the highest point after breakfast within 3 hours
    let breakfast_glucose_excursion_time = onlyParticipant.data
        .filter(d => d.time >= breakfast_startTime && d.time <= (breakfast_startTime + 3))
        .reduce((acc, d) => d.value > acc.value ? d : acc, { value: 0 }).time;

    let lunch_glucose_excursion_time = onlyParticipant.data
        .filter(d => d.time >= lunch_startTime && d.time <= (lunch_startTime + 3))
        .reduce((acc, d) => d.value > acc.value ? d : acc, { value: 0 }).time;

    let breakfast_glucose_excursion_value = onlyParticipant.data
        .find(d => d.time === breakfast_glucose_excursion_time).value;
    let lunch_glucose_excursion_value = onlyParticipant.data
        .find(d => d.time === lunch_glucose_excursion_time).value;

    // Calculate the glucose recovery time for breakfast which is the time where the glucose level return to the baseline level after breakfast within 3 hours
    let breakfast_glucose_recovery_time = onlyParticipant.data
        .filter(d => d.time > breakfast_startTime && d.time <= (breakfast_startTime + 3) && d.value <= breakfast_start_glucose_value)
        .reduce((acc, d) => d.time < acc.time ? d : acc, { time: Infinity }).time;
    let lunch_glucose_recovery_time = onlyParticipant.data
        .filter(d => d.time > lunch_startTime && d.time <= (lunch_startTime + 3) && d.value <= lunch_start_glucose_value)
        .reduce((acc, d) => d.time < acc.time ? d : acc, { time: Infinity }).time;
    let breakfast_glucose_recovery_value = onlyParticipant.data
        .find(d => d.time === breakfast_glucose_recovery_time).value;
    let lunch_glucose_recovery_value = onlyParticipant.data
        .find(d => d.time === lunch_glucose_recovery_time).value;


    // add a vertical dash line to indicate the meal type
    mealForParticipant.forEach(d => {
        const mealTime = parseTime(d.Timestamp);
        svg.append("line")
            .attr("x1", x(mealTime))
            .attr("x2", x(mealTime))
            .attr("y1", 0)
            .attr("y2", rowHeight)
            .attr("stroke", "red")
            .attr("stroke-dasharray", "5,5")
            .append("title") // Tooltip for meal type
            .text(`Meal: ${d["Meal Type"]}`);

        // Adding text mentioning the meal type
        svg.append("text")
            .attr("x", x(mealTime))
            .attr("y", -10) // Position above the line
            .attr("text-anchor", "middle")
            .attr("fill", "red")
            .style("font-size", "15px")
            .text(d["Meal Type"]);


    });

    // Adding a red line going from the meal starting time to the excursion time to indicate the glucose excursion
    svg.append("line")
        .attr("x1", x(breakfast_startTime))
        .attr("x2", x(breakfast_glucose_excursion_time))
        .attr("y1", y(breakfast_start_glucose_value)) // Baseline glucose level
        .attr("y2", y(breakfast_start_glucose_value)) // Baseline glucose level
        .attr("stroke", "red")
        .attr("stroke-width", 2) // Thicker line
        .attr("class", "hover-line-ge");

    svg.append("line")
        .attr("x1", x(lunch_startTime))
        .attr("x2", x(lunch_glucose_excursion_time))
        .attr("y1", y(lunch_start_glucose_value)) // Baseline glucose level
        .attr("y2", y(lunch_start_glucose_value)) // Baseline glucose level
        .attr("stroke", "red")
        .attr("stroke-width", 2) // Thicker line
        .attr("class", "hover-line-ge");

    // add a dot at both end of the line to indicate the excursion
    svg.append("circle")
        .attr("cx", x(breakfast_startTime))
        .attr("cy", y(breakfast_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");
    svg.append("circle")
        .attr("cx", x(breakfast_glucose_excursion_time))
        .attr("cy", y(breakfast_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");

    svg.append("circle")
        .attr("cx", x(lunch_startTime))
        .attr("cy", y(lunch_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");
    svg.append("circle")
        .attr("cx", x(lunch_glucose_excursion_time))
        .attr("cy", y(lunch_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");

    // Add a dot at both ends of the line to indicate the excursion
    svg.append("circle")
        .attr("cx", x(breakfast_startTime))
        .attr("cy", y(breakfast_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");
    svg.append("circle")
        .attr("cx", x(breakfast_glucose_excursion_time))
        .attr("cy", y(breakfast_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");

    // Add hover effect to the line
    const hoverTextGroup = svg.append("g")
        .style("display", "none");

    const hoverTextBackground = hoverTextGroup.append("rect")
        .attr("id", "hover-text-background")
        .attr("x", 5)
        .attr("y", svgHeight - margin.bottom - 135)
        .attr("width", 250)
        .attr("height", 70)
        .attr("fill", "black")
        .attr("opacity", 0.7) // Make the background more transparent
        .attr("rx", 10) // Add rounded corners
        .attr("ry", 10); // Add rounded corners

    const hoverText = hoverTextGroup.append("text")
        .attr("id", "hover-text")
        .attr("x", 10)
        .attr("y", svgHeight - margin.bottom - 120)
        .attr("text-anchor", "start")
        .attr("fill", "white")
        .style("font-size", "16px")
        .attr("class", "hover-text")
        .text("Glucose Excursion:\n the maximum glucose level after breakfast");

    // Add event listeners for hover effect with increased hover area
    svg.selectAll(".hover-line-ge")
        .on("mouseover", function() {
            d3.select(this).attr("stroke-width", 4);
            hoverTextGroup.style("display", null);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke-width", 2);
            hoverTextGroup.style("display", "none");
        })
        .on("mousemove", function(event) {
            const [mouseX, mouseY] = d3.pointer(event);
            hoverTextGroup.attr("transform", `translate(${mouseX + 10},${mouseY - 10})`);
        });

    // Add invisible rectangles to increase hover area
    svg.selectAll(".hover-line-ge")
        .each(function() {
            const line = d3.select(this);
            const x1 = line.attr("x1");
            const x2 = line.attr("x2");
            const y1 = line.attr("y1");
            const y2 = line.attr("y2");

            svg.append("rect")
                .attr("x", Math.min(x1, x2) - 10)
                .attr("y", Math.min(y1, y2) - 10)
                .attr("width", Math.abs(x2 - x1) + 20)
                .attr("height", Math.abs(y2 - y1) + 20)
                .attr("fill", "none")
                .attr("pointer-events", "all")
                .on("mouseover", function() {
                    line.dispatch("mouseover");
                })
                .on("mouseout", function() {
                    line.dispatch("mouseout");
                })
                .on("mousemove", function(event) {
                    line.dispatch("mousemove", { detail: event });
                });
        });

    // visualize the glucose recovery time
    svg.append("line")
        .attr("x1", x(breakfast_glucose_excursion_time))
        .attr("x2", x(breakfast_glucose_recovery_time))
        .attr("y1", y(breakfast_start_glucose_value)) // Excursion glucose level
        .attr("y2", y(breakfast_start_glucose_value)) // Recovery glucose level
        .attr("stroke", "red")
        .attr("stroke-width", 2) // Thicker line
        .attr("class", "hover-line-gr");
    
    svg.append("line")
        .attr("x1", x(lunch_glucose_excursion_time))
        .attr("x2", x(lunch_glucose_recovery_time))
        .attr("y1", y(lunch_start_glucose_value)) // Excursion glucose level
        .attr("y2", y(lunch_start_glucose_value)) // Recovery glucose level
        .attr("stroke", "red")
        .attr("stroke-width", 2) // Thicker line
        .attr("class", "hover-line-gr");

    // Add a dot at both ends of the line to indicate the recovery
    svg.append("circle")
        .attr("cx", x(breakfast_glucose_excursion_time))
        .attr("cy", y(breakfast_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");
    svg.append("circle")
        .attr("cx", x(breakfast_glucose_recovery_time))
        .attr("cy", y(breakfast_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");
    svg.append("circle")
        .attr("cx", x(lunch_glucose_excursion_time))
        .attr("cy", y(lunch_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");
    svg.append("circle")
        .attr("cx", x(lunch_glucose_recovery_time))
        .attr("cy", y(lunch_start_glucose_value))
        .attr("r", 5)
        .attr("fill", "red");

        // Creating new hover text group
        const hoverTextGroupRecovery = svg.append("g")
            .style("display", "none");

        const hoverTextBackgroundRecovery = hoverTextGroupRecovery.append("rect")
            .attr("id", "hover-text-background-recovery")
            .attr("x", 5)
            .attr("y", svgHeight - margin.bottom - 135)
            .attr("width", 250)
            .attr("height", 70)
            .attr("fill", "black")
            .attr("opacity", 0.7) // Make the background more transparent
            .attr("rx", 10) // Add rounded corners
            .attr("ry", 10); // Add rounded corners

        const hoverTextRecovery = hoverTextGroupRecovery.append("text")
            .attr("id", "hover-text-recovery")
            .attr("x", 10)
            .attr("y", svgHeight - margin.bottom - 120)
            .attr("text-anchor", "start")
            .attr("fill", "white")
            .style("font-size", "16px")
            .attr("class", "hover-text")
            .text("Glucose Recovery:\n the glucose level return to the baseline level after breakfast");

        // Add event listeners for hover effect
        svg.selectAll(".hover-line-gr")
            .on("mouseover", function() {
                d3.select(this).attr("stroke-width", 4);
                hoverTextGroupRecovery.style("display", null);
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke-width", 2);
                hoverTextGroupRecovery.style("display", "none");
            })
            .on("mousemove", function(event) {
                const [mouseX, mouseY] = d3.pointer(event);
                hoverTextGroupRecovery.attr("transform", `translate(${mouseX + 10},${mouseY - 10})`);
            });

        // Add invisible rectangles to increase hover area
        svg.selectAll(".hover-line-gr")
            .each(function() {
                const line = d3.select(this);
                const x1 = line.attr("x1");
                const x2 = line.attr("x2");
                const y1 = line.attr("y1");
                const y2 = line.attr("y2");

                svg.append("rect")
                    .attr("x", Math.min(x1, x2) - 10)
                    .attr("y", Math.min(y1, y2) - 10)
                    .attr("width", Math.abs(x2 - x1) + 20)
                    .attr("height", Math.abs(y2 - y1) + 20)
                    .attr("fill", "none")
                    .attr("pointer-events", "all")
                    .on("mouseover", function() {
                        line.dispatch("mouseover");
                    })
                    .on("mouseout", function() {
                        line.dispatch("mouseout");
                    })
                    .on("mousemove", function(event) {
                        line.dispatch("mousemove", { detail: event });
                    });
            });

    // visualize the excursion time
    svg.append("line")
        .attr("x1", x(breakfast_glucose_excursion_time))
        .attr("x2", x(breakfast_glucose_excursion_time))
        .attr("y1", y(breakfast_start_glucose_value)) // Baseline glucose level
        .attr("y2", y(breakfast_glucose_excursion_value)) // Excursion glucose level
        .attr("stroke", "red")
        .attr("stroke-width", 2) // Thicker line
        .attr("class", "hover-line-ex");

    svg.append("line")
        .attr("x1", x(lunch_glucose_excursion_time))
        .attr("x2", x(lunch_glucose_excursion_time))
        .attr("y1", y(lunch_start_glucose_value)) // Baseline glucose level
        .attr("y2", y(lunch_glucose_excursion_value)) // Excursion glucose level
        .attr("stroke", "red")
        .attr("stroke-width", 2) // Thicker line
        .attr("class", "hover-line-ex");

    // Add a dot at both ends of the line to indicate the excursion
    svg.append("circle")
        .attr("cx", x(breakfast_glucose_excursion_time))
        .attr("cy", y(breakfast_glucose_excursion_value))
        .attr("r", 5)
        .attr("fill", "red");
    svg.append("circle")
        .attr("cx", x(lunch_glucose_excursion_time))
        .attr("cy", y(lunch_glucose_excursion_value))
        .attr("r", 5)
        .attr("fill", "red");

    // Creating new hover text group for excursion
    const hoverTextGroupExcursion = svg.append("g")
        .style("display", "none");

    const hoverTextBackgroundExcursion = hoverTextGroupExcursion.append("rect")
        .attr("id", "hover-text-background-excursion")
        .attr("x", 5)
        .attr("y", svgHeight - margin.bottom - 135)
        .attr("width", 250)
        .attr("height", 70)
        .attr("fill", "black")
        .attr("opacity", 0.7) // Make the background more transparent
        .attr("rx", 10) // Add rounded corners
        .attr("ry", 10); // Add rounded corners

    const hoverTextExcursion = hoverTextGroupExcursion.append("text")
        .attr("id", "hover-text-excursion")
        .attr("x", 10)
        .attr("y", svgHeight - margin.bottom - 120)
        .attr("text-anchor", "start")
        .attr("fill", "white")
        .style("font-size", "16px")
        .attr("class", "hover-text")
        .text("Glucose Excursion:\n the maximum glucose level after breakfast");

    // Add event listeners for hover effect with increased hover area
    svg.selectAll(".hover-line-ex")
        .on("mouseover", function() {
            d3.select(this).attr("stroke-width", 4);
            hoverTextGroupExcursion.style("display", null);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke-width", 2);
            hoverTextGroupExcursion.style("display", "none");
        })
        .on("mousemove", function(event) {
            const [mouseX, mouseY] = d3.pointer(event);
            hoverTextGroupExcursion.attr("transform", `translate(${mouseX + 10},${mouseY - 10})`);
        });

    // Add invisible rectangles to increase hover area
    svg.selectAll(".hover-line-ex")
        .each(function() {
            const line = d3.select(this);
            const x1 = line.attr("x1");
            const x2 = line.attr("x2");
            const y1 = line.attr("y1");
            const y2 = line.attr("y2");

            svg.append("rect")
                .attr("x", Math.min(x1, x2) - 10)
                .attr("y", Math.min(y1, y2) - 10)
                .attr("width", Math.abs(x2 - x1) + 20)
                .attr("height", Math.abs(y2 - y1) + 20)
                .attr("fill", "none")
                .attr("pointer-events", "all")
                .on("mouseover", function() {
                    line.dispatch("mouseover");
                })
                .on("mouseout", function() {
                    line.dispatch("mouseout");
                })
                .on("mousemove", function(event) {
                    line.dispatch("mousemove", { detail: event });
                });
        });

}

async function main() {
    try {
        const { nonDiabeticParticipants, cgmData, mealData } = await fetchData();
        plotData(nonDiabeticParticipants, cgmData, mealData);
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

main();
