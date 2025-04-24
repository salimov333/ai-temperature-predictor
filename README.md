# AI Temperature Predictor

This project is an `AI-powered web application` that employs a **neural network**, designed to mimic the human brain, and trained using `machine learning` techniques, to **forecast temperature**. The model takes the hour of the day and month of the year as input. The application further provides a feature to plot a chart visualizing the temperature changes over a 24-hour period for a specific month.

## Features

- **Temperature Prediction:** Enter the hour (0-23) and month (1-12) to get a predicted temperature in Celsius.
- **Interactive Chart:** View a line chart showing temperature predictions for all hours of a selected month.
- **Prediction History:** A history of your recent temperature predictions is displayed.
- **Download Chart:** Download the temperature chart as a PNG image.
- **Save/Load Model:** Save the trained neural network model as a JSON file and potentially load it later (Note: loading functionality would require additional implementation).
- **Training Progress:** Real-time display of the neural network's training progress.

## Technologies Used

- [`brain.js`](https://brain.js.org/): A JavaScript library for neural networks.
- [`Chart.js`](https://www.chartjs.org/): A simple and flexible JavaScript charting library.
- HTML
- CSS
- JavaScript

## Setup and Usage

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/salimov333/ai-temperature-predictor.git
    cd ai-temperature-predictor/
    ```
2.  **Open `index.html` in a web browser:**
    Simply open the `index.html` file in your preferred web browser. No server setup is required as this is a client-side application.

## How to Use

1.  **Predict Temperature:**
    - Enter the hour (0 to 23) in the "Hour" input field.
    - Enter the month (1 to 12) in the "Month" input field.
    - Click the "Predict Now" button.
    - The predicted temperature will be displayed below the button.
2.  **View Temperature Chart:**
    - Enter the desired month (1 to 12) in the "Month for Chart" input field.
    - Click the "Draw Chart" button.
    - The temperature chart for the selected month will be displayed.
3.  **Download Chart:**
    - Click the "Download Chart as Image" button to save the current chart as a PNG file.
4.  **Save Model:**
    - Click the "Save Model as File" button to download the trained neural network model as a JSON file.

## Data

The training data consists of temperature samples for each hour of the day and month of the year. _**Note:** The accuracy of the predictions is limited by the size and quality of the training data. Future improvements could include expanding the dataset with more granular data and additional weather factors._

## Neural Network

The neural network is implemented using the `brain.js` library and has the following architecture:

- Input layer: 2 neurons (for hour and month)
- Hidden layers: 2 layers with 10 and 5 neurons respectively.
- Output layer: 1 neuron (for temperature)

The network is trained using `backpropagation`.

## Future Improvements

- **Expand Dataset:** Incorporate more data points (e.g., hourly data), historical weather data, and additional weather features (e.g., day of the week, season, location).
- **Model Loading:** Implement functionality to load a previously saved model.
- **Enhance Accuracy:** Experiment with different network architectures, training parameters, and data preprocessing techniques to improve prediction accuracy.
- **Add Location Support:** Allow users to input their location to get more localized predictions.
- **Improve User Interface:** Enhance the UI with features like error handling, loading indicators, and more interactive charts.

## Author

Salem Helwani - [GitHub](https://github.com/salimov333)
