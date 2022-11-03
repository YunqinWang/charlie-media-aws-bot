const http = require("https")

const hsAccessToken = process.env.HS_ACCESS_TOKEN
const hsApiHost = 'api.hubspot.com'
const hsContactsUrl = '/crm/v3/objects/contacts'

exports.handler = async (event) => {
    // event example
    console.log(event)
    // {
    //     "email": "bcooper@biglytics.net",
    //     "firstName": "Bryan",
    //     "lastName": "Cooper",
    //     "serviceInquired": "web development"
    // }
    //var newContactInfo = JSON.parse(event)
    var newContactInfo = event
    console.log(newContactInfo)
    const contactRes = await createContact(newContactInfo)
    //console.log(`Contact created. Id: ${contactRes.id}`)

    const response = {
        statusCode: 200,
        body: JSON.stringify('Done!'),
    };
    return response;
};

// HubSpot
function createContact(newContactInfo) {
    const properties = {
      "email": newContactInfo.email,
      "name": newContactInfo.name,
      "genearl_service_inquired": newContactInfo.generalService,
      "specific_service_inquired": newContactInfo.specificService,
      "domain":newContactInfo.domain,
    }
    
    const options = {
        hostname: hsApiHost,
        path: hsContactsUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Bearer ${hsAccessToken}`
        }
    }
    
    const body = {
    	"properties": properties
    }
    
    return sendPostRequest(options, body)
}

// utils
function sendPostRequest(options, body) {
    return new Promise(function(resolve, reject) {
        var req = http.request(options, res => {
            let rawData = '';
            res.on('data', chunk => {
              rawData += chunk;
            });
    
            res.on('end', () => {
                try {
                    resolve(JSON.parse(rawData));
                } catch (err) {
                    console.log(`Error: ${err}`);
                    reject(new Error(err));
                }
            });
        });
        
        req.on('error', err => {
            console.log(`Error: ${err}`);
            reject(new Error(err));
        });
        
        req.write(JSON.stringify(body));
        req.end();
    });
}