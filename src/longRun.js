import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// Set up container dimensions and margins
const margin = { top: 50, right: 50, bottom: 30, left: 100 };
const width = 960 - margin.left - margin.right;  // Wider visualization
const rowHeight = 100; // Height for each individual row
const plotGap = 20; // Gap between plots

// First, fetch the bio.json data to identify participants from each group
fetch('assets/vis_data/bio.json')
  .then(response => response.json())
  .then(bioData => {
    console.log("All participants:", bioData.length);
    
    // Filter for non-diabetic participants only
    const nonDiabeticParticipants = bioData.filter(p => p["diabetes level"] === "Non-diabetic");
    console.log("Non-diabetic participants:", nonDiabeticParticipants.length);
    console.log("Non-diabetic PIDs:", nonDiabeticParticipants.map(p => p.PID));
    
    // Now fetch the CGM data to get glucose values
    return fetch('assets/vis_data/CGMacros.json')
      .then(response => response.json())
      .then(cgmData => {
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
        
        console.log("Non-diabetic PIDs with data:", nonDiabeticPidsWithData);
        
        // Select up to 5 non-diabetic participants with data
        let selectedPIDs = nonDiabeticPidsWithData.slice(0, 5);
        
        // If we don't have 5 non-diabetic participants with data, use the ones we have
        console.log(`Selected ${selectedPIDs.length} non-diabetic participants for visualization`);
        
        // Calculate total SVG height based on number of participants
        const totalHeight = (selectedPIDs.length * (rowHeight + plotGap)) - plotGap + margin.top + margin.bottom;
        
        // Append the SVG object to the specific HTML element (.graph-wrapper4)
        const svg = d3.select('.graph-wrapper-panel4')
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', totalHeight)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Process the timestamp to extract hours and minutes
        const parseTime = (timestamp) => {
          try {
            // Handle different timestamp formats
            let timeParts;
            if (timestamp.includes(":")) {
              // If it has a colon, extract the time part
              if (timestamp.split(" ").length >= 3) {
                // Format like "1 days 00:00:00"
                timeParts = timestamp.split(" ")[2].split(":");
              } else {
                // Format might be different
                timeParts = timestamp.split(" ").find(part => part.includes(":")).split(":");
              }
              
              const hours = parseInt(timeParts[0]);
              const minutes = parseInt(timeParts[1]);
              return hours + minutes/60; // Convert to decimal hours
            } else {
              // If no time format found, return 0
              console.warn("No time format found in timestamp:", timestamp);
              return 0;
            }
          } catch (error) {
            console.error("Error parsing timestamp:", timestamp, error);
            return 0;
          }
        };
        
        // Set up the x scale (shared across all plots)
        const x = d3.scaleLinear()
          .domain([0, 24]) // 24 hours in a day
          .range([0, width]);
        
        // Add the shared x-axis at the top
        svg.append("g")
          .attr("class", "x-axis")
          .call(d3.axisTop(x)
            .ticks(12)
            .tickFormat(d => {
              // Format like "12AM", "6AM", "12PM", etc.
              if (d === 0 || d === 24) return "12AM";
              if (d === 12) return "12PM";
              return d < 12 ? `${d}AM` : `${d-12}PM`;
            }));
        
        // Add title for the entire visualization
        svg.append("text")
          .attr("x", width / 2)
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
          // Filter CGM data for this participant for day 1
          const participantDayData = cgmData.filter(d => 
            String(d.PID) === String(pid) && 
            (d.Timestamp.startsWith("1 days") || d.Timestamp.startsWith("1 day") || d.Timestamp.includes("Day 1"))
          );
          
          // Process the data for visualization
          const processedData = participantDayData.map(d => ({
            time: parseTime(d.Timestamp),
            value: d["Libre GL"] || 0
          })).filter(d => d.value > 0);
          
          // Find max glucose value for this participant
          if (processedData.length > 0) {
            const participantMax = d3.max(processedData, d => d.value);
            if (participantMax > maxGlucoseValue) {
              maxGlucoseValue = participantMax;
            }
            
            // Get the participant info from bio data
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
        
        // Add 10% padding to the max glucose value
        maxGlucoseValue = maxGlucoseValue * 1.1;
        
        // Second pass to create the plots now that we know the global y-scale
        participantData.forEach((participant, index) => {
          // Create a group for this participant's plot
          const plotGroup = svg.append("g")
            .attr("class", `plot-group-${participant.pid}`)
            .attr("transform", `translate(0, ${index * (rowHeight + plotGap)})`);
          
          // Set up the y scale for this plot
          const y = d3.scaleLinear()
            .domain([0, maxGlucoseValue])
            .range([rowHeight, 0]);
            
          // Add y-axis to the left side
          plotGroup.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks(3));
            
          // Add participant label to the left of the y-axis
          plotGroup.append("text")
            .attr("x", -80)
            .attr("y", rowHeight / 2)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(`PID ${participant.pid}`);
          
          // Add additional participant info
          plotGroup.append("text")
            .attr("x", -80)
            .attr("y", rowHeight / 2 + 15)
            .attr("text-anchor", "start")
            .style("font-size", "10px")
            .text(`${participant.age}y ${participant.gender}`);
            
          // Create the area generator
          const area = d3.area()
            .x(d => x(d.time))
            .y0(rowHeight)
            .y1(d => y(d.value))
            .curve(d3.curveBasis);
            
          // Create the line generator
          const line = d3.line()
            .x(d => x(d.time))
            .y(d => y(d.value))
            .curve(d3.curveBasis);
            
          // Add the area
          plotGroup.append("path")
            .datum(participant.data)
            .attr("fill", "steelblue")
            .attr("fill-opacity", 0.3)
            .attr("d", area);
            
          // Add the line
          plotGroup.append("path")
            .datum(participant.data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);
            
          // Add horizontal grid lines
          plotGroup.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", rowHeight)
            .attr("y2", rowHeight)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
            
          plotGroup.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(70))  // Lower normal glucose limit
            .attr("y2", y(70))
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4")
            .attr("stroke-width", 1);
            
          plotGroup.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(140))  // Upper normal glucose limit
            .attr("y2", y(140))
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4")
            .attr("stroke-width", 1);
        });
        
        // Add an overall legend for the normal glucose range
        if (participantData.length > 0) {
          const legendGroup = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 180}, -30)`);
            
          // Add text for the legend
          legendGroup.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .style("font-size", "10px")
            .text("Normal Glucose Range:");
            
          // Add the dash line for reference
          legendGroup.append("line")
            .attr("x1", 110)
            .attr("x2", 140)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "gray")
            .attr("stroke-dasharray", "4")
            .attr("stroke-width", 1);
            
          // Add the text for the range
          legendGroup.append("text")
            .attr("x", 145)
            .attr("y", 0)
            .style("font-size", "10px")
            .text("70-140 mg/dL");
        }
        
        // If no data was found, show a message
        if (participantData.length === 0) {
          svg.append("text")
            .attr("x", width / 2)
            .attr("y", 100)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "red")
            .text("No data available for non-diabetic participants on day 1");
        }
      });
  })
  .catch(error => console.error('Error loading data:', error));