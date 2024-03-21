const express = require('express');
const {google} = require('googleapis');
require('dotenv').config();

const keys = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER,
    client_x509_cert_url: process.env.CLIENT,
    universe_domain: process.env.UNIVERSE_DOMAIN,
};

const spreadSheetId = process.env.SHEET_ID;

const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
]);

client.authorize(function (err, tokens) {
    if (err) {
        console.log(err);
        return;
    } else {
        console.log('Authorized successfully');
    }
});

const app = express();
const port = 3001;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

function transformData(data) {
    let name = null;

    const colorReplacements = {
        R: 'red',
        G: 'green',
        BL: 'blue',
        Y: 'yellow',
        PI: 'pink',
        PR: 'purple',
        BK: 'black',
        O: 'orange',
        W: 'white',
    };

    const transformedValues = data.values
        .map((row, index) => {
            row[1] === '1' ? (name = row[0]) : (name = name);

            if (!row[2]) return null;
            const color = colorReplacements[row[2]] || row[2];
            return {
                name: name,
                id: row[1],
                color: color,
                grade: row[3],
                setter: row[4].toLowerCase(),
            };
        })
        .filter(item => item !== null);

    return {
        transformedValues,
        routeNum: transformedValues.length,
    };
}

app.get('/read', async (req, res) => {
    const gsapi = google.sheets({version: 'v4', auth: client});

    const opt = {
        spreadsheetId: spreadSheetId,
        range: 'Sheet1!B3:F137',
    };

    try {
        const data = await gsapi.spreadsheets.values.get(opt);
        const transformedData = transformData(data.data);
        res.json(transformedData);
    } catch (err) {
        console.log(err);
        res.status(500).send('Error reading spreadsheet');
    }
});
