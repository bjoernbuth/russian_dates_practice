let currentAudioUrl = null;


// Function to generate random date in the format dd.mm.yyyy
function generateRandomDate() {
    const day = Math.floor(Math.random() * 28) + 1; // Random day between 1 and 28
    const month = Math.floor(Math.random() * 12) + 1; // Random month between 1 and 12
    // const year = Math.floor(Math.random() * (2023 - 1900 + 1)) + 1900; // Random year between 1900 and 2023
    const year_min = 1000;
    const year_max = 2023;
    const year = Math.floor(Math.random() * (year_max - year_min + 1)) + year_min; // Random year between 1900 and 2023

    // Random year between 0 and 3000 (for some reason for large year the speech output 
    // is jus wrong, hence this limit)
    // const year = Math.floor(Math.random() * 1000);

    // Format the date with leading zeros if needed
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = month.toString().padStart(2, '0');

    return `${formattedDay}.${formattedMonth}.${year}`;
}

// Function to display the date on the page
function showDate(date) {
    const dateText = document.getElementById('dateText');
    dateText.textContent = date;
}

// Function to generate speech from text and save it as an audio file
function generateSpeech(text, filename) {
    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU'; // Set the language to Russian
    utterance.voice = synthesis.getVoices().find(voice => voice.lang === 'ru-RU'); // Find a Russian voice

    const audioContext = new AudioContext();
    const audioDestination = audioContext.createMediaStreamDestination();
    utterance.addEventListener('end', () => {
        audioContext
            .startRendering()
            .then((renderedBuffer) => {
                const audioData = exportWAV(renderedBuffer);
                const audioBlob = new Blob([audioData], { type: 'audio/wav' });

                //changed
                currentAudioUrl = URL.createObjectURL(audioBlob); // Update currentAudioUrl

                const audioUrl = URL.createObjectURL(audioBlob);
                const link = document.createElement('a');
                link.href = audioUrl;
                link.download = filename;
                link.click();
            })
            .catch((error) => {
                console.error('Error rendering audio:', error);
            });
    });

    synthesis.speak(utterance);

    function exportWAV(renderedBuffer) {
        const numChannels = renderedBuffer.numberOfChannels;
        const audioData = new Float32Array(renderedBuffer.length * numChannels);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = renderedBuffer.getChannelData(channel);
            audioData.set(channelData, channel * renderedBuffer.length);
        }

        const buffer = new ArrayBuffer(44 + audioData.length * 2);
        const view = new DataView(buffer);

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + audioData.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, audioContext.sampleRate, true);
        view.setUint32(28, audioContext.sampleRate * 4, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, audioData.length * 2, true);

        for (let i = 0; i < audioData.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        }

        return buffer;
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}


// Example usage
const date = '04.09.1957';
const filename = 'date_audio.wav';

// generateSpeech(date, filename);

document.getElementById('generateButton').addEventListener('click', function () {
    const date = generateRandomDate(); // Generate a random date
    currentAudioDate = date;
    showDate("") // Clear the text
    const filename = 'date_audio.wav';
    generateSpeech(date, filename); // Generate speech
});

document.getElementById('showTextButton').addEventListener('click', function () {
    // If currentAudioDate is not null, display it
    if (currentAudioDate) {
        showDate(currentAudioDate); // Display the date on the page
    }
});

document.getElementById('repeatButton').addEventListener('click', function () {
    // If currentAudioDate is not null, repeat the speech
    if (currentAudioDate) {
        const filename = 'date_audio.wav';
        generateSpeech(currentAudioDate, filename); // Generate speech
    } else {
        console.log('No audio to repeat');
    }
});


