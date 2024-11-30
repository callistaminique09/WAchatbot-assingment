const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
require('dotenv').config();

// Gemini API URL (replace with actual URL if different)
const GEMINI_API_URL = "https://api.google.com/gemini/v1/chat";

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(), // Saves login session locally
});

// Prompt Design
const promptTemplate = `
## About
You are a helpful customer service bot named "PresBot" for President University.

## Tasks
Your job is to answer questions related to admissions, courses, facilities, and general inquiries at President University. 
Respond in 1-2 paragraphs only, with a polite and professional tone. Use either English or Indonesian depending on the user input.

## Addressing
Always address users as "Kakak" in Indonesian or "Dear" in English. Avoid using "Anda" or overly casual terms.

## Limits
Only provide answers you know. If uncertain, direct the user to contact info@president.ac.id or call +62 21 8910 9762. Do not fabricate responses.

## Recommendations
When asked about program recommendations, first inquire about the user's interests and career aspirations. Suggest up to three relevant programs.

Now respond to this user's query:
`;

// QR Code generation
client.on('qr', (qr) => {
    console.log('Scan the QR code below to log in:');
    qrcode.generate(qr, { small: true });
});

// When the client is ready
client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

// Process incoming messages
client.on('message', async (message) => {
    console.log(`Received message: ${message.body}`);

    // Build prompt for Gemini API
    const userMessage = message.body;
    const prompt = `${promptTemplate}\nUser's message: "${userMessage}"`;

    try {
        // Send prompt to Gemini API
        const response = await axios.post(
            GEMINI_API_URL,
            {
                messages: [{ role: "user", content: prompt }],
                model: "gemini-1-chat", // Replace with the correct Gemini model name
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Extract AI response
        const aiResponse = response.data.choices[0].message.content;

        // Send AI response back to WhatsApp
        message.reply(aiResponse);
    } catch (error) {
        console.error("Error communicating with Gemini API:", error);

        // Fallback response
        message.reply("Maaf Kakak, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti atau hubungi info@president.ac.id untuk bantuan lebih lanjut.");
    }
});

// Handle authentication failures
client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

// Start the WhatsApp client
client.initialize();
