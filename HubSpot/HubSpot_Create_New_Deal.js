const http = require("https")

const hsAccessToken = process.env.HS_ACCESS_TOKEN
const hsApiHost = 'api.hubspot.com'
const hsDealsUrl = '/crm/v3/objects/deals'
const hsContactsUrl = '/crm/v3/objects/contacts'
const hsOwnersUrl = '/crm/v3/owners'
const hsNotesUrl = '/crm/v3/objects/notes'
const defaultOwner = 'charlie@charliemedia.us'
const dealStageMap = {
    "new": "38640966",
    "contactMade": "37160815",
    "meetingScheduled": "38628683",
    "proposalSent": "contractsent"
}

const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({ region: "us-east-1" })

exports.handler = async (event) => {
    const contactId = event.objectId
    const contactProperties = ['message', 'service_inquired','firstname', 'lastname', 'jobtitle', 'company', 'email', 'form_submission_source']
    try {
        // contact data received from HubSpot
        const contactRes = await getContactById(contactId, contactProperties)
        console.log(JSON.stringify(contactRes))
        const firstName = contactRes.properties.firstname
        const lastName = contactRes.properties.lastname
        const message = contactRes.properties.message
        const serviceInquired = contactRes.properties.service_inquired || "General Request"
        const jobTitle = contactRes.properties.jobtitle
        const companyName = contactRes.properties.company
        
        // List available owners in HubSpot
        const ownersRes = await listAllOwners()
        const owners = ownersRes.results
        const owner = owners.find(o => o.email == defaultOwner)
        
        // create a new deal
        const dealProperties = {
          "amount": "0.00",
          "closedate": weeksFromNow(3),
          "dealname": `${firstName} ${lastName} - ${serviceInquired}`,
          "dealstage": dealStageMap["new"],
          "hubspot_owner_id": owner.id,
          "pipeline": "default"
        }
        const dealRes = await createDeal(dealProperties)
        const dealId = dealRes.id
        console.log(`Deal ${dealId} created. Response: ${JSON.stringify(dealRes)}`)
        
        // associate the new deal to contact
        const dealAssociationRes = await asscociateDealWithContact(contactId, dealId)
        console.log(`Associated deal ${dealId} to contact ${contactId}. Response: ${JSON.stringify(dealAssociationRes)}`)
        
        // log deal info in note
        const noteProperties = {
            "hs_timestamp": new Date().toJSON(),
            "hs_note_body": `Name: ${firstName} ${lastName}<br>Company: ${companyName}<br>Title: ${jobTitle}<br>Service Inquired: ${serviceInquired}<br><br>Message:<br>${message}`,
            "hubspot_owner_id": owner.id,
            "hs_attachment_ids": ""
        }
        const noteRes = await createNote(noteProperties)
        const noteId = noteRes.id
        const noteAssociationRes = await asscociateNoteWithDeal(noteId, dealId)
        console.log(`Associated note ${noteId} to deal ${dealId}. Response: ${JSON.stringify(noteAssociationRes)}`)
        
        // Send contact to ActiveCampaign
        await invokeHubSpotNewContactToAC({hsContact: contactRes, hsDealId: dealId})
    } catch (e) {
        console.log(`Error: ${e.stack}`)
    }
    
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

// HubSpot
function getContactById(contactId, properties) {
    const options = {
        hostname: hsApiHost,
        path: encodeURI(`${hsContactsUrl}/${contactId}?properties=${properties.join(',')}`),
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Bearer ${hsAccessToken}`
        }
    }
    return sendGetRequest(options)
}

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

function createDeal(properties) {
    const options = {
        hostname: hsApiHost,
        path: hsDealsUrl,
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

function createNote(properties) {
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
    	"properties": properties
    }
    
    return sendPostRequest(options, body)
}

function asscociateDealWithContact(contactId, dealId) {
    const options = {
        hostname: hsApiHost,
        path: `${hsDealsUrl}/${dealId}/associations/Contact/${contactId}/deal_to_contact`,
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

function asscociateNoteWithDeal(noteId, dealId) {
    const options = {
        hostname: hsApiHost,
        path: `${hsNotesUrl}/${noteId}/associations/Deal/${dealId}/note_to_deal`,
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

// ActiveCampaign
function invokeHubSpotNewContactToAC(payload) {
    return new Promise((resolve, reject) => {
        const params = {
            FunctionName: 'HubSpot_New_Contact_To_ActiveCampaign',
            InvocationType: 'Event',
            Payload: JSON.stringify(payload)
        };
        
        lambda.invoke(params, (err, results) => {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(`Successfully sent to HubSpot_New_Contact_To_ActiveCampaign.`);
                return resolve(results);
            }
        });
    })
}

// utils
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

function weeksFromNow(weeks) {
    const date = new Date()
    date.setDate(date.getDate() + weeks * 7)
    return date.toJSON()
}
