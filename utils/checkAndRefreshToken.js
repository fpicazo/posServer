const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');

const tokenhourPath = path.join(__dirname, 'tokenhour.json');

url_get_token = "https://accounts.zoho.com/oauth/v2/token?refresh_token=" + process.env.refreshtoken+ "&grant_type=refresh_token&client_id=" + process.env.client_id + "&client_secret=" + process.env.client_secret + "&redirect_uri=http://zoho.com"


function updateTokenHour() {
    return new Promise((resolve, reject) => {
        fs.readFile(tokenhourPath, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
                return;
            }

            const now = new Date();
            let tokenData = data ? JSON.parse(data) : {};
            let lastTokenHour = tokenData.lastTokenHour ? new Date(tokenData.lastTokenHour) : new Date(0);

            // Check if the difference is more than 1 hour
            if ((now - lastTokenHour) / (1000 * 60 * 60) > 1) {
                lastTokenHour = now;
                // Generate or fetch a new token value here. This is just a placeholder.
                axios.post(url_get_token).then((response) => {
                    console.log(response.data)
                    const newToken = response.data.access_token;
                    // Update the file with the new time and token
                    fs.writeFile(tokenhourPath, JSON.stringify({ lastTokenHour, token: newToken }), (writeErr) => {
                        if (writeErr) {
                            reject(writeErr);
                            return;
                        }
                        console.log("Token and time updated.");
                        resolve({ lastTokenHour, token: newToken });
                    });
                }

                ).catch((err) => {
                    console.error(err);
                });
            } else {
                console.log("Token and time not updated. Less than 1 hour passed.");
                resolve(tokenData);
            }
        });
    });
}




module.exports = { updateTokenHour };