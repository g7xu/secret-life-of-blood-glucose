document.addEventListener('DOMContentLoaded', () => {
    const quizForm = document.getElementById('quiz-form');
    const quizResult = document.getElementById('quiz-result');
    const nextButton = document.getElementById('next-button');
    let currentQuestion = 1;

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

        quizForm.innerHTML = ''; 

        quizResult.innerHTML = `
            <h3>Your Answers:</h3>
            <p>Weight: ${weight} kg</p>
            <p>Height: ${height} cm</p>
            <p>Gender: ${gender}</p>
        `;
    });
});