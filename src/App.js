import React, { useState } from 'react';
import axios from 'axios';
import { PDFDocument, rgb } from 'pdf-lib';
import './App.css';

function App() {
    const [text, setText] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');

    const handleGeneratePDF = async () => {
        try {
            // Call GPT-4 to generate descriptive content
            const gptResponse = await axios.post('https://api.openai.com/v1/completions', {
                prompt: text,
                max_tokens: 200
            }, {
                headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` }
            });

            const generatedText = gptResponse.data.choices[0].text.trim();

            // Call DALL-E to generate an image
            const dalleResponse = await axios.post('https://api.openai.com/v1/images/generations', {
                prompt: text,
                n: 1,
                size: '512x512'
            }, {
                headers: { 'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}` }
            });

            const imageUrl = dalleResponse.data.data[0].url;

            // Fetch the image and convert it to base64
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

            // Create a PDF document
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();

            // Add the text
            page.drawText(generatedText, {
                x: 50,
                y: height - 100,
                size: 20,
                color: rgb(0, 0, 0)
            });

            // Add the image
            const jpgImage = await pdfDoc.embedJpg(`data:image/jpeg;base64,${base64Image}`);
            const jpgDims = jpgImage.scale(0.5);
            page.drawImage(jpgImage, {
                x: 50,
                y: height - 300,
                width: jpgDims.width,
                height: jpgDims.height
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="App">
            <h1>Multi-modal PDF Generator</h1>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text here"
            ></textarea>
            <button onClick={handleGeneratePDF}>Generate PDF</button>
            {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>}
        </div>
    );
}

export default App;
