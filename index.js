const express = require('express');
const ejs = require('ejs');
const path = require('path');
const qrcode = require('qrcode'); 
const app = express();
const port = 3000;

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
    
    qrcode.toDataURL(input_text, (err, src) => {
        if (err) {
            console.error('Error generating QR code:', err);
            return res.redirect('/?error=Something went wrong');
        }

        // Render the scan page with the generated QR code
        res.render('scan', {
            qr_code: src
        });
    });
});

// Start the server and listen on the specified port
app.listen(port, console.log('Listening on port 3000'));
