const express = require('express');
const ejs = require('ejs');
const path = require('path');
const qrcode = require('qrcode'); 
const { MongoClient } = require('mongodb');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // To create a unique filename

const app = express();
const port = 3000;

// Connection string for local MongoDB
const mongoUri = 'mongodb://localhost:27017/qr_codes';

let db;


// Connect to MongoDB
MongoClient.connect(mongoUri)
    .then(client => {
        db = client.db('qr_codes'); // Access the qr_codes database
        console.log('Connected to MongoDB');
    })
    .catch(error => console.error('MongoDB connection error:', error));


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

    const filename = `${uuidv4()}.png`;
    const filePath = path.join(__dirname, 'public', filename);

    qrcode.toFile(filePath, input_text, async (err) => {
        if (err) {
            console.error('Error generating QR code:', err);
            return res.redirect('/?error=Something went wrong');
        }

        // Store the QR code data in MongoDB
        try {
            await db.collection('qr_codes').insertOne({ text: input_text, filename });
            console.log('QR code data saved to MongoDB');
        } catch (error) {
            console.error('Error saving to MongoDB:', error);
        }

        res.render('scan', {
            qr_code: `data:image/png;base64,${Buffer.from(fs.readFileSync(filePath)).toString('base64')}`,
            download_link: `/download/${filename}`
        });
    });
});

//API endpoint to retrieve QR code data from MongoDB
app.get('/api/qr-codes', async (req, res) => {
    try {
        const qrCodes = await db.collection('qr_codes').find().toArray();
        res.json(qrCodes);
    } catch (error) {
        console.error('Error fetching QR codes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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
