# Final-Project
Final Project for DSC 106

To get started:
located the data from the [website](https://physionet.org/content/cgmacros/1.0.0/), unzip it and rename the folder to `data`.


# Brief Introduction
...

# Project Folder Layout
    .
    ├── script.js                   # Handles page interactions and animations using GSAP
    ├── styles.css                  # Defines CSS styles for the webpage
    ├── index.js                    # Loads and processes JSON data using D3.js to create interactive graphs and visualizations
    ├── index.html                  # The main HTML file that structures the webpage and includes references to CSS and JavaScript files
    ├── global.js                   # Manages state and interactions for visualizations, including participant selection and time range controls, using D3.js

# Visualziation Run Down
- Diabetes is a chronic (long-lasting) health condition that affects how your body turns food into energy.
- It is prevelant health issue in the use
- In our dataset, we specially look at Type 2 Diabetes. but click the button to see the difference between type 1 and type 2 diabeties (page page 1 and page page 2)
- **quiz** what the user, in our dataset, out of 45 participants, we randomly sample 5 particiapnts from the three diabeitic groups: non-diabetic, pre-diabetic, Diabetic. For the purpose of easy visualization. Based on ur answer, we will highly the one that is most similar to you in future visualization
- the interactive **meal frequency visualization**
    - functionality: user can hove over to see the calories break down, filter out snack, breakfast, lunch and dinner
    - text: "just by looking at the visualization, you might observe that the diabetic group has regular meal while non-diabetic group don't. This might trick you into thinking: regular meal is not health since diabetic group's meal is regular and on time. The reality is that, People with Type 2 Diabetes has their meals regulated because their body has problem in control the blood glucose after each meal." To futher visualize the concept of lose control, let's move on
- **rolling glucose visualization**:
    - text before the visualization: in this visualziation, we plot the change of glucose level across time of all the 15 sample particiapnts. Through seeing the moving dot (specially the variance), you are going to have a better sense of understanding on the degrees of fluctuation between Diabetic and non diabetic group
    - text after the visualization: The blood glucose trend can be compared to surfing on a wave—while non-diabetic individuals experience a relatively calm and predictable ride, pre-diabetic individuals encounter a bit more excitement with occasional swells. In contrast, diabetic individuals face a wild and unpredictable journey, with extreme fluctuations resembling the chaos of stormy waves.
- **explaining on the metrics visualization**: 
    - text before the visualization: while we have got a general understanding on the unstability of the blood glucose acorss. How does it related to the meal frequency? and why do diabetic group needs to control their meal frequency? To answer this question, we need to employ a systematic way to qualify the change in blood glucose after meal
    - Luckily, in the dataset, all participants were being asked to have the same breakfast and lunch at similar time which can be viewed as a control setting which all groups take in the same calories in a simialr time period.
        - not believe me validate the result, by moving user to the **meal frequency visualization** with images when they hove over
    - therefore, we are going to look at the change of participants blood glucose after their breakfast and dinner
- **three metrics expliniation graph**:
    - text: after people eat, their blood glucose is going to for sure increase, but by how much? we will identify the glucose excursion after they have their meal
    - text: moreover, we will find the time they took to achieve the glucose excursion
    - text: we will find the time they took to recovery from the excursion
    - **presenting them with animated graph**
- **aggregated visualization**: after finding all the metrics from all the participants, we aggregate their stats by finding their means and std. Then, we use the std and mean to plot a normal distribution
    - hover over to see the distribution of the value (help needed)
    - option to look at breakfast or lunch 
    - text: from visualization, we can see that diabetic group has a higher mean and std comparing other group
- **interactive visualization**: 
    - text: while our visualization focus on the meal frequency and the glucose trend after breakfast and lunch. There are more areas where you can explore. For example, how is the snacks help or impact the participants with different diabetic status. Therefore, we provide you with an interactive visualization where you can...




# Design Logistics
...

# acknowledgements
...

# Contact info
...

## Prototype Write-up:
1. So far we have done a lot of exploratory data analysis to understand all the facets of the data from our study and isolate key takeaways we want to communicate to our audience.
Namely, we wish to use data to inform users on the importance of their diet in managing their blood glucose levels, which impacts their wellbeing from moment-to-moment in terms of their energy level, as well as their health in the long-run, such as in predicting the onset of Type II Diabetes.
We first looked at meal distributions over time, to see if Non-diabetic, Pre-diabetic, and Diabetic individuals differ in their meal-eating habits.
We also made visualizations to understand how glucose spikes look over time, and understand how their relationship with different macronutrients taken in every meal, such as fiber. We found that more fiber causes less of a glucose spike.
We then made an outline of the story we wanted to tell based on these findings, and will be working on adding interactive visualizations and polishing them in the next steps.

2. The most challenging part is looking to be several small obstacles as opposed to anything major halting progress such as finding through EDA data anomalies presenting themselves right now for a subset of our diabetic participants who appear to eating into a strict regimen. Another issue that will present itself later is high data density pushing speedy data access to the foreground due to needing to have fast subsets of the data needing to be rendered. Although we may be able to solve the problem with JSON usage of only the data needed as opposed to what may be an API call to some cloud storage whether that’s necessary yet isn’t certain. One more typical issue that's arising is the quantity of NaN being found in some of our groups and will likely require some type of imputation more analysis of the data is still needed to find out whether that’s most appropriate for where it's happening.




asdfasdfashdfkajsdbfaoiuefgbqejhb
a
sdfasdfasdf
as
df
asf

