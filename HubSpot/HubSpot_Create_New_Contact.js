const http = require("https")

const hsAccessToken = process.env.HS_ACCESS_TOKEN
const hsApiHost = 'api.hubspot.com'
const hsContactsUrl = '/crm/v3/objects/contacts'
const hsNotesUrl = '/crm/v3/objects/notes'
const hsOwnersUrl = '/crm/v3/owners'
const defaultOwner = 'charlie@charliemedia.us'

exports.handler = async (event) => {
    // event example
    // {
    //     "email": "bcooper@biglytics.net",
    //     "firstName": "Bryan",
    //     "lastName": "Cooper",
    //     "serviceInquired": "web development"
    // }
    //var newContactInfo = JSON.parse(event)

    // List available owners in HubSpot
    const ownersRes = await listAllOwners()
    const owners = ownersRes.results
    const owner = owners.find(o => o.email == defaultOwner)

    let newContactInfo = event
    const contactProperties = {
        "email": newContactInfo.email,
        "firstname":newContactInfo.firstname,
        "lastname":newContactInfo.lastname,
        "hubspot_owner_id":owner.id,
    }

    const contactRes = await createContact(contactProperties);
    const contactId = contactRes.id;

    const noteProperties = {
        "hs_timestamp": new Date().toJSON(),
        "hs_note_body": `
        Client Name: ${newContactInfo.firstname} ${newContactInfo.lastname}<br>
        Service Inquired: ${newContactInfo.generalService}<br>
        Project Due: ${newContactInfo.dueDate}<br>
        Website Domain: ${newContactInfo.domain}<br>
        Message: ${newContactInfo.message}
        `,
        "hubspot_owner_id": owner.id,
        "hs_attachment_ids": ""
    }

    const noteRes = await createNote(noteProperties);
    const noteId = noteRes.id

    const noteAssociationRes = await asscociateNoteWithContact(noteId, contactId)
    console.log(`Associated note ${noteId} to deal ${contactId}. Response: ${JSON.stringify(noteAssociationRes)}`)

    // event = {
    //     body: [{
    //         objectId: [hsContactId],
    //         subscriptionType: "contact.creation",
    //         changeSource: "BOT"
    //     }]
    // }
    const response = {
        // statusCode: 200,
        // body: JSON.stringify('Done!'),
        body: [{
                    objectId: [contactId], // use contactRes
                    subscriptionType: "contact.creation",
                    changeSource: "BOT"
                }]
    };
    return response;
};

function listAllOwners() {
    const options = {
        hostname: hsApiHost,
        path: hsOwnersUrl,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Bearer ${hsAccessToken}`
        }
    }
    return sendGetRequest(options)
}

// create new contact on HubSpot
function createContact(contactProperties) {
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
    	"properties": contactProperties
    }
    return sendPostRequest(options, body)
}

// log contact info in note
function createNote(noteProperties) {    
    const options = {
        hostname: hsApiHost,
        path: hsNotesUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Bearer ${hsAccessToken}`
        }
    }
    
    const body = {
    	"properties": noteProperties
    }
    
    return sendPostRequest(options, body)
}

function asscociateNoteWithContact(noteId, contactId) {
    const options = {
        hostname: hsApiHost,
        path: `${hsNotesUrl}/${noteId}/associations/Contact/${contactId}/note_to_contact`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Bearer ${hsAccessToken}`
        }
    }
    
    const body = {}
    
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

function sendGetRequest(options) {
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
                  reject(new Error(err));
                }
            });
        });
        
        req.on('error', err => {
            reject(new Error(err));
        });
        
        req.end();
    });
}