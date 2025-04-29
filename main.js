let worker = new Worker("worker.js");
let trainedModel = null;
let minTemp, maxTemp;
let chart = null;
let trainingData = [];
let modelError = null;
let totalIterations = 40000;
let learningRate = 0.001;

// DOM Elements
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const trainingStatus = document.getElementById("training-status");
const trainingError = document.getElementById("training-error");
const predictBtn = document.getElementById("predictBtn");
const drawChartBtn = document.getElementById("drawChartBtn");
const downloadChartBtn = document.getElementById("downloadChartBtn");
const resultText = document.getElementById("result");
const historyList = document.getElementById("history");
const hourInput = document.getElementById("hour");
const monthPredictInput = document.getElementById("month_predict");
const monthChartInput = document.getElementById("month_chart");
const predictionForm = document.getElementById("prediction-form");
const cancelTrainingBtn = document.getElementById("cancelTrainingBtn");
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Load prediction history from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedHistory = JSON.parse(localStorage.getItem('leipzigPredictions')) || [];
    if (savedHistory.length === 0) {
        // Add empty state only if history is truly empty
        if (historyList.children.length === 0) {
            const emptyState = document.createElement('li');
            emptyState.classList.add('empty-state');
            emptyState.textContent = "No predictions yet";
            historyList.appendChild(emptyState);
        }
    } else {
        savedHistory.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `Hour: ${item.hour}:00, Month: ${item.month} → ${item.prediction}°C`;
            historyList.appendChild(li);
        });
    }
    // Update clear button state
    updateClearButtonState();
});

function disableUI() {
    [predictBtn, drawChartBtn, downloadChartBtn, hourInput, monthPredictInput, monthChartInput].forEach(el => el.disabled = true);
    cancelTrainingBtn.disabled = false;
}

function enableUI() {
    [predictBtn, drawChartBtn, downloadChartBtn, hourInput, monthPredictInput, monthChartInput, clearHistoryBtn].forEach(el => el.disabled = false);
    cancelTrainingBtn.disabled = true;
    updateClearButtonState();
}

function displayError(message) {
    resultText.textContent = `❌ ${message}`;
    resultText.style.color = "#e74c3c";
}

function clearError() {
    resultText.textContent = "";
    resultText.style.color = "";
}

// Fetch training data
fetch("trainingData.json")
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        trainingData = data;
        startTraining(trainingData);
    })
    .catch(error => {
        console.error("Data load error:", error);
        displayError("Failed to load Leipzig climate data");
        progressText.innerHTML = "❌ Data Error";
        trainingStatus.textContent = "Failed";
        trainingError.textContent = error.message;
    });

function startTraining(data) {
    disableUI();
    progressContainer.style.display = "block";
    trainingStatus.textContent = "Training...";
    worker.postMessage({
        type: "TRAIN",
        trainingData: data,
        totalIterations,
        learningRate,
    });
}

// Worker communication
worker.onmessage = function (e) {
    if (e.data.type === "PROGRESS") {
        const percent = Math.round((e.data.iterations / totalIterations) * 100);
        progressBar.value = percent;
        trainingError.textContent = e.data.error ? e.data.error.toFixed(4) : "N/A";
    } else if (e.data.type === "COMPLETE") {
        trainedModel = e.data.model;
        console.log("Training complete", trainedModel);
        minTemp = e.data.minTemp;
        maxTemp = e.data.maxTemp;
        enableUI();
        progressText.innerHTML = "✅ Training Complete";
        trainingStatus.textContent = "Ready";
        setTimeout(() => progressContainer.style.display = "none", 1500);
    } else if (e.data.type === "ERROR") {
        console.error("Worker error:", e.data.message);
        displayError(`Training failed: ${e.data.message}`);
        progressText.innerHTML = "❌ Training Failed";
        trainingStatus.textContent = "Error";
        trainingError.textContent = e.data.message;
    }
};

// Cancel training
// Updated cancel handler
cancelTrainingBtn.addEventListener("click", () => {
    try {
        // Immediately disable cancel button
        cancelTrainingBtn.disabled = true;

        // Terminate current worker
        if (worker) {
            worker.terminate();
            worker = null;
        }

        // Reset training state
        trainedModel = null;
        minTemp = maxTemp = undefined;
        modelError = null;

        // Update UI
        progressBar.value = 0;
        trainingError.textContent = "N/A";
        progressText.innerHTML = "⏹ Training Cancelled";
        trainingStatus.textContent = "Cancelled";

        // Hide progress container after delay
        setTimeout(() => {
            progressContainer.style.display = "none";
            enableUI();
        }, 1500);

        // Create fresh worker instance
        worker = new Worker("worker.js");
    } catch (error) {
        console.error("Cancel error:", error);
        displayError("Failed to cancel training");
        enableUI();
    }
});

// Prediction logic
predictionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const hour = parseInt(hourInput.value);
    const month = parseInt(monthPredictInput.value);

    if (!validateInput(hour, month)) return;

    try {
        const net = new brain.NeuralNetwork();
        net.fromJSON(trainedModel);
        const input = normalizeInput(hour, month);
        const rawPrediction = net.run(input).temperature;
        const prediction = +denormalize(rawPrediction).toFixed(1);

        // Update UI
        resultText.textContent = `Predicted Temperature: ${prediction}°C`;
        // Remove empty state if present
        const emptyState = historyList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        // Add new prediction to history
        const li = document.createElement("li");
        li.textContent = `Hour: ${hour}:00, Month: ${month} → ${prediction}°C`;
        historyList.prepend(li);
        updateClearButtonState();

        // Update localStorage
        const history = JSON.parse(localStorage.getItem('leipzigPredictions')) || [];
        history.unshift({ hour, month, prediction });
        localStorage.setItem('leipzigPredictions', JSON.stringify(history.slice(0, 20)));

    } catch (error) {
        console.error("Prediction error:", error);
        displayError("Prediction failed. Please try again.");
    }
});

// Validation
function validateInput(hour, month) {
    let isValid = true;
    let errors = [];

    if (isNaN(hour)) errors.push("Hour must be a number");
    if (hour < 0 || hour > 23 || !Number.isInteger(hour)) errors.push("Hour must be 0-23");
    if (isNaN(month)) errors.push("Month must be a number");
    if (month < 1 || month > 12 || !Number.isInteger(month)) errors.push("Month must be 1-12");

    if (errors.length > 0) {
        displayError(errors.join(". "));
        return false;
    }
    clearError();
    return true;
}

// Clear history functionality
clearHistoryBtn.addEventListener('click', () => {
    
    // Clear from localStorage
    localStorage.removeItem('leipzigPredictions');


    // Clear from UI
    historyList.innerHTML = '';

    // Show feedback
    const feedback = document.createElement('li');
    feedback.textContent = "History cleared successfully";
    feedback.style.color = "#27ae60";
    historyList.appendChild(feedback);

    // Remove feedback after 2 seconds
    setTimeout(() => {
        feedback.remove();
        updateClearButtonState();
    }, 2000);
});

// Chart functions
drawChartBtn.addEventListener("click", () => {
    const month = parseInt(monthChartInput.value);
    if (!Number.isInteger(month)) {
        displayError("Please select a valid month");
        return;
    }

    try {
        clearError();
        const net = new brain.NeuralNetwork();
        net.fromJSON(trainedModel);
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const temps = hours.map(hour => {
            const input = normalizeInput(hour, month);
            return +denormalize(net.run(input).temperature).toFixed(1);
        });

        const ctx = document.getElementById("tempChart").getContext("2d");
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: hours.map(h => `${h}:00`),
                datasets: [{
                    label: `Leipzig Temperatures - Month ${month}`,
                    data: temps,
                    borderColor: createTemperatureGradient(ctx),
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        title: { display: true, text: "Temperature (°C)" },
                        grid: { color: "#e2e8f0" }
                    },
                    x: {
                        title: { display: true, text: "Hour of Day" },
                        grid: { color: "#f1f5f9" }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Chart error:", error);
        displayError("Failed to generate chart");
    }
});

// Helper functions
function normalizeInput(hour, month) {
    return { hour: hour / 23, month: (month - 1) / 11 };
}

function denormalize(value) {
    return value * (maxTemp - minTemp) + minTemp;
}

function createTemperatureGradient(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#FF6B6B"); // Hot
    gradient.addColorStop(0.5, "#FFE66D"); // Warm
    gradient.addColorStop(1, "#4ECDC4"); // Cool
    return gradient;
}

function updateClearButtonState() {
    const hasRealPredictions = Array.from(historyList.children).some(
        li => !li.classList.contains('empty-state')
    );
    clearHistoryBtn.disabled = !hasRealPredictions;
}

// Chart download
downloadChartBtn.addEventListener("click", () => {
    if (!chart) {
        displayError("No chart to download");
        return;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = chart.canvas.width;
    tempCanvas.height = chart.canvas.height;

    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(chart.canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `leipzig_temp_${monthChartInput.value}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
});