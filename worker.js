importScripts('https://cdn.jsdelivr.net/npm/brain.js');

const MESSAGE_TYPE = {
    TRAIN: "TRAIN",
    PROGRESS: "PROGRESS",
    COMPLETE: "COMPLETE",
    ERROR: "ERROR"
};

let minTemp = Infinity;
let maxTemp = -Infinity;

// Updated normalizeData function
function normalizeData(data) {
    try {
        // Validate data structure first
        if (!Array.isArray(data)) {
            throw new Error("Training data must be an array");
        }

        data.forEach(item => {
            if (typeof item?.output?.temperature !== 'number') { // Fix: Check for number type
                throw new Error(`Invalid data item: ${JSON.stringify(item)}`);
            }
            const temp = item.output.temperature;
            minTemp = Math.min(minTemp, temp);
            maxTemp = Math.max(maxTemp, temp);
        });

        const range = maxTemp - minTemp || 1; // Prevent division by zero

        return data.map(item => ({
            input: {
                hour: item.input.hour / 23,
                month: (item.input.month - 1) / 11 // Months 1-12 → 0-1
            },
            output: {
                temperature: (item.output.temperature - minTemp) / range
            }
        }));
    } catch (error) {
        self.postMessage({
            type: MESSAGE_TYPE.ERROR,
            message: `Data normalization failed: ${error.message}`
        });
        throw error;
    }
}

function trainNetwork(normalizedData, options) {
    try {
        const net = new brain.NeuralNetwork({
            hiddenLayers: [12, 6],
            activation: 'leaky-relu',
            leakyReluAlpha: 0.01
        });

        net.train(normalizedData, {
            iterations: options.totalIterations,
            learningRate: options.learningRate,
            errorThresh: 0.0005,
            log: false,
            callbackPeriod: 100,
            callback: (status) => {
                self.postMessage({
                    type: MESSAGE_TYPE.PROGRESS,
                    iterations: status.iterations,
                    error: status.error
                });
            }
        });

        return net.toJSON();
    } catch (error) {
        self.postMessage({
            type: MESSAGE_TYPE.ERROR,
            message: `Training failed: ${error.message}`
        });
        throw error;
    }
}

self.onmessage = function (e) {
    try {
        if (e.data.type === MESSAGE_TYPE.TRAIN) {
            const normalized = normalizeData(e.data.trainingData);
            const model = trainNetwork(normalized, e.data);
            self.postMessage({
                type: MESSAGE_TYPE.COMPLETE,
                model: model,
                minTemp,
                maxTemp
            });
        }
    } catch (error) {
        self.postMessage({
            type: MESSAGE_TYPE.ERROR,
            message: `Worker error: ${error.message}`
        });
    }
};