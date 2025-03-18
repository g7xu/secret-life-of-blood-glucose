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

const mealFrequencySection = document.querySelector("#meal_frequency .container");
const selectContainer = document.querySelector("#select");

const mealTypes = ["All", "Breakfast", "Lunch", "Dinner", "Snack"];
const mealDropdown = document.createElement("select");
mealDropdown.id = "meal-filter";
mealDropdown.style.marginRight = "10px";

mealTypes.forEach(type => {
    let option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    mealDropdown.appendChild(option);
});

const resetZoomButton = document.createElement("button");
resetZoomButton.textContent = "Reset Zoom";

selectContainer.appendChild(mealDropdown);
selectContainer.appendChild(resetZoomButton);

function getColorForGroup(group) {
    const colors = {
        "Non-diabetic": "#00bfae",  // Teal
        "Pre-diabetic": "#fac127",  // Yellow
        "Diabetic": "#fb6900"       // Orange
    };
    return colors[group] || "#000000"; // Default to black if no match
}

d3.json("assets/vis_data/meal_data.json").then(data => {
    const parseTime = d3.timeParse("%d days %H:%M:%S");

    data.forEach(d => {
        d.Timestamp = parseTime(d.Timestamp);
    });

    const minTime = d3.min(data, d => d.Timestamp);
    const maxTime = new Date(minTime.getTime() + 10 * 24 * 60 * 60 * 1000);

    const width = 700, height = 100;
    const margin = {top: 30, right: 30, bottom: 50, left: 50};

    function createGraph(group, graphId, title) {
        const svg = d3.select(`#${graphId}`).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleTime()
            .domain([minTime, maxTime])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, 600])
            .range([height, 0]);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent");

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .attr("class", "x-axis")
            .call(d3.axisBottom(xScale)
                .ticks(d3.timeDay.every(1))
                .tickFormat((d, i) => `Day ${i + 1}`));

        svg.append("g")
            .attr("class", "y-axis");

        svg.selectAll("line")
            .data(group)
            .enter()
            .append("line")
            .attr("x1", d => xScale(d.Timestamp))
            .attr("x2", d => xScale(d.Timestamp))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", d => getColorForGroup(d['diabetes level']))
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", 3)
                    .attr("stroke", "red");
    
                // const imagePath = d["Participant_ID"] < 10
                //     ? `./data/CGMacros/CGMacros-00${d["Participant_ID"]}/${d["Image path"]}`
                //     : `./data/CGMacros/CGMacros-0${d["Participant_ID"]}/${d["Image path"]}`;
    
                tooltipDiv.innerHTML = `
                    <strong>Meal Type:</strong> ${d["Meal Type"] || "No data"}<br>
                    <strong>Carbs:</strong> ${d["Carbs"] + ' g' || "No data"}<br>
                    <strong>Protein:</strong> ${d["Protein"] + ' g' || "No data"}<br>
                    <strong>Fat:</strong> ${d["Fat"] + ' g'|| "No data"}<br>
                    <strong>Fiber:</strong> ${d["Fiber"] + ' g' || "No data"}<br>
                `;
    
                tooltipDiv.style.left = (event.pageX + 10) + "px";
                tooltipDiv.style.top = (event.pageY + 10) + "px";
                tooltipDiv.style.display = "block";
            })
            .on("mousemove", function(event) {
                tooltipDiv.style.left = (event.pageX + 10) + "px";
                tooltipDiv.style.top = (event.pageY + 10) + "px";
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("stroke-width", 1)
                    .attr("stroke", d => getColorForGroup(d['diabetes level']));
    
                tooltipDiv.style.display = "none";
            })
            .on("click", function(event, d) {
                // const imagePath = d["Participant_ID"] < 10
                //     ? `./data/CGMacros/CGMacros-00${d["Participant_ID"]}/${d["Image path"]}`
                //     : `./data/CGMacros/CGMacros-0${d["Participant_ID"]}/${d["Image path"]}`;
    
                tooltipDiv.innerHTML = `
                    <strong>Meal Type:</strong> ${d["Meal Type"] || "N/A"}<br>
                    <strong>Carbs:</strong> ${d["Carbs"]} g<br>
                    <strong>Protein:</strong> ${d["Protein"] || "N/A"} g<br>
                    <strong>Fat:</strong> ${d["Fat"] || "N/A"} g<br>
                    <strong>Fiber:</strong> ${d["Fiber"] || "N/A"} g<br>
                `;
    
                tooltipDiv.style.left = (event.pageX + 10) + "px";
                tooltipDiv.style.top = (event.pageY + 10) + "px";
                tooltipDiv.style.display = "block";
            });

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(title);

        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", function(event) {
                const newX = event.transform.rescaleX(xScale);
                svg.select(".x-axis")
                    .call(d3.axisBottom(newX)
                        .ticks(d3.timeDay.every(1))
                        .tickFormat((d, i) => `Day ${i + 1}`));

                svg.selectAll("line")
                    .attr("x1", d => newX(d.Timestamp))
                    .attr("x2", d => newX(d.Timestamp));
            });

        svg.call(zoom);
    }

    // createGraph(data.filter(d => d['diabetes level'] === 'Non-diabetic'), "graph-nondiabetic", "Non-Diabetic Group");
    // createGraph(data.filter(d => d['diabetes level'] === 'Pre-diabetic'), "graph-prediabetic", "Pre-Diabetic Group");
    // createGraph(data.filter(d => d['diabetes level'] === 'Diabetic'), "graph-diabetic", "Diabetic Group");

    function updateGraphs() {
        const selectedMealType = mealDropdown.value;
        const filteredData = selectedMealType === "All" ? data : data.filter(d => d["Meal Type"].toLowerCase() === selectedMealType.toLowerCase());

        d3.select("#graph-nondiabetic").html("");
        d3.select("#graph-prediabetic").html("");
        d3.select("#graph-diabetic").html("");
        createGraph(filteredData.filter(d => d['diabetes level'] === 'Non-diabetic'), "graph-nondiabetic", "Non-Diabetic Group");
        createGraph(filteredData.filter(d => d['diabetes level'] === 'Pre-diabetic'), "graph-prediabetic", "Pre-Diabetic Group");
        createGraph(filteredData.filter(d => d['diabetes level'] === 'Diabetic'), "graph-diabetic", "Diabetic Group");
    }

    mealDropdown.addEventListener("change", updateGraphs);
    updateGraphs();

    resetZoomButton.onclick = () => updateGraphs();

}).catch(error => console.error("Error loading the JSON data:", error));
