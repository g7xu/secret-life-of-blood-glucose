document.addEventListener('DOMContentLoaded', () => {
    const quizForm = document.getElementById('quiz-form');
    const quizResult = document.getElementById('quiz-result');
    const nextButton = document.getElementById('next-button');
    let currentQuestion = 1;
    let dataset = [];

    async function loadDataset() {
        try {
            const response = await fetch('assets/vis_data/sampled_bio.json');
            dataset = await response.json();
        } catch (error) {
            console.error("Error loading dataset:", error);
        }
    }
    loadDataset();

    function calculateBMI(weight, height) {
        // Convert height from cm to meters
        const heightInMeters = height / 100;
        // Calculate BMI: weight (kg) / height^2 (m)
        return weight / (heightInMeters * heightInMeters);
    }

    const enableNextButton = () => {
        const currentQuestionElement = document.querySelector(`.quiz-question[data-question="${currentQuestion}"]`);
        const inputs = currentQuestionElement.querySelectorAll('input, select');
        let allFilled = true;
        inputs.forEach(input => {
            if (!input.value) {
                allFilled = false;
            }
        });
        nextButton.disabled = !allFilled;
    };

    document.querySelectorAll('.quiz-question input, .quiz-question select').forEach(input => {
        input.addEventListener('input', enableNextButton);
    });

    nextButton.addEventListener('click', () => {
        const currentQuestionElement = document.querySelector(`.quiz-question[data-question="${currentQuestion}"]`);
        const nextQuestionElement = document.querySelector(`.quiz-question[data-question="${currentQuestion + 1}"]`);

        if (nextQuestionElement) {
            currentQuestionElement.style.display = 'none';
            nextQuestionElement.style.display = 'block';
            currentQuestion++;
            nextButton.disabled = true;
        }

        if (!document.querySelector(`.quiz-question[data-question="${currentQuestion + 1}"]`)) {
            nextButton.style.display = 'none';
            quizForm.querySelector('button[type="submit"]').style.display = 'block';
        }
    });

    quizForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(quizForm);
        const weight = formData.get('weight');
        const height = formData.get('height');
        const gender = formData.get('gender');

        const userBMI = calculateBMI(weight, height);
    
    // Find closest matches from each diabetes level
    const matches = findClosestMatches(userBMI, gender);

        quizForm.innerHTML = ''; 

        quizResult.innerHTML = `
        <h3 id = "header">Your Closest Matches <br> For Each Diabetic Level:</h3>
        <p id = "match" >Non-diabetic Participant ${matches.find(m => m.diabetesLevel === "Non-diabetic").pid} <br>
        Pre-diabetic Participant ${matches.find(m => m.diabetesLevel === "Pre-diabetic").pid}<br>
       Diabetic Participant ${matches.find(m => m.diabetesLevel === "Diabetic").pid}<br> </p>
        <p id="result">Pay attention to matched participants in the visualizations to see how your glucose levels may compare.</p>
        `;
    });


    function findClosestMatches(userBMI, userGender) {
        const groups = {
            "Non-diabetic": [],
            "Pre-diabetic": [],
            "Diabetic": []
        };
    
        dataset.forEach(person => {
            // Convert gender to match format if needed (e.g., "Male" -> "M")
            const formattedUserGender = userGender === "Male" ? "M" : (userGender === "Female" ? "F" : userGender);
            const genderMatch = (!formattedUserGender || person.Gender === formattedUserGender);
            
            if (genderMatch) {
                groups[person["diabetes level"]].push({
                    ...person,
                    bmiDiff: Math.abs(person.BMI - userBMI)
                });
            }
        });
    
        // Find closest match from each group
        return Object.keys(groups).map(diabetesLevel => {
            if (groups[diabetesLevel].length > 0) {
                // Sort by BMI difference and take the closest match
                const closestMatch = groups[diabetesLevel].sort((a, b) => a.bmiDiff - b.bmiDiff)[0];
                return {
                    diabetesLevel,
                    pid: closestMatch.PID
                };
            } else {
                return { diabetesLevel, pid: "No match found" };
            }
        });
    }
});