const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const token = require('./token.json');

const credentials = require('./credentials');

// Load client secrets from a local file.

let auth = authorize(credentials, () => {
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    console.log(authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */

const sheets = google.sheets({version: 'v4', auth});

let spreadsheetId = '1GNONXHfZZjuzmoAQA8kumWwq8BSuVxZFJzLAuHJkG2c';

module.exports = {
    add: function (range, values) {
        sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: range,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: values
            }
        }, (err, res) => {
            if (err) {
                console.error(err);
                console.log("ошибка");
                return;
            }

            // TODO: Change code below to process the `response` object:
            // console.log(res);
        });
    },
    update: function (range, values) {
        sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: range,
                valueInputOption: "USER_ENTERED",

                resource: {
                    values: values
                }
            }, (err, res) => {
                if (err) {
                    console.error(err);
                    console.log("ошибка");
                    return;
                }

                // TODO: Change code below to process the `response` object:
                // console.log(res);
            }
        )
    },
    remove: function (range) {
        sheets.spreadsheets.values.clear({
            spreadsheetId: spreadsheetId,
            range: range
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const rows = res;
        })
    },
    get: function (range, callback) {
        sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range,
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const rows = res.data.values;

            if (rows.length) {
                // console.log(rows);
                callback(rows);
                // console.log('Name, Major:');
                // // Print columns A and E, which correspond to indices 0 and 4.
                // rows.map((row) => {
                //     console.log(`${row[0]}, ${row[4]}`);
                // });
            } else {
                console.log('No data found.');
            }
        });
    }
};