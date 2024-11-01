const express = require('express');
const ejs = require('ejs');
const path = require('path');
const qrcode = require('qrcode'); 
const app = express();
const port = 3000;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // To create a unique filename

// Middleware to parse JSON and URL-encoded data
app.use(express.json())
app.use(express.urlencoded({extended: false}));

// Set EJS as the template engine and define views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Render the home page with a form for input
app.get('/',(req, res) => {
    const error = req.query.error; //Retrieve error message from query parameter
    res.render('index', { error });
});

// Handle form submission and generate the QR code
app.post('/scan', (req, res) => {
    const input_text = req.body.text;

    if (!input_text) {
        return res.redirect('/?error=URL or Text is required');
    }

    const filename = `${uuidv4()}.png`; // Unique filename for the QR code
    const filePath = path.join(__dirname, 'public', filename);

    qrcode.toFile(filePath, input_text, (err) => {
        if (err) {
            console.error('Error generating QR code:', err);
            return res.redirect('/?error=Something went wrong');
        }

        // Render the scan page with the generated QR code and download link
        res.render('scan', {
            qr_code: `data:image/png;base64,${Buffer.from(fs.readFileSync(filePath)).toString('base64')}`,
            download_link: `/download/${filename}` // Link to download the QR code
        });
    });
});

// Serve QR code as a downloadable file
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'public', filename);

    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.redirect('/?error=File not found');
        }
    });
});

// Start the server and listen on the specified port
app.listen(port, console.log('Listening on port 3000'));
