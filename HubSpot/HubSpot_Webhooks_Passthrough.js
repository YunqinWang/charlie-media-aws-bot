const http = require('https')
const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({ region: "us-east-1" })
const dealStageMap = {
    "new": "38640966",
    "contactMade": "37160815",
    "meetingFinished": "38628683",
    "proposalSent": "contractsent"
}

const hsAccessToken = process.env.HS_ACCESS_TOKEN
const hsApiHost = 'api.hubspot.com'
const hsContactsUrl = '/crm/v3/objects/contacts'

exports.handler = async (event) => {
    // event = {
    //     body: [{
    //         objectId: [hsContactId],
    //         subscriptionType: "contact.creation",
    //         changeSource: "BOT"
    //     }]
    // }

    let body;
    //check if event.body is a string
    try {
        body = JSON.parse(event).body;
    } catch (e) {
        body = event.body;
    }
    
    for (var i = 0; i < body.length; i++) {
        var data = body[i]
        const subType = data.subscriptionType
        const source = data.changeSource
        try {
            if (subType == 'contact.creation' && (source == 'FORM' || source == 'BOT')) {
                // assign owner to the new contact
                await invokeHubSpotAddOnwerToContact(data)
                // create new deal and assign deal owner
                await invokeHubSpotCreateNewDeal(data)
            } else if (subType == 'deal.propertyChange' && data.propertyName == 'dealstage') {
                // if HS deal stage moved to "Meeting Finished"
                if (data.propertyValue == dealStageMap["meetingFinished"]) {
                    const hsDealId = data.objectId
                    const assocRes = await findContactIdByDealId(hsDealId)
                    if (assocRes.results.length > 0) {
                        const hsContactId = assocRes.results[0].id
                        const contactRes = await getContactById(hsContactId, ['active_campaign_id'])
                        const acContactId = contactRes.properties.active_campaign_id
                        if (acContactId) {
                            // Add contact to the "API Integration - Step 2" list 
                            // the "API Integration - Step 2: Send Internal Research Email" automation in ActiveCampaign
                            const acApiIntegrationStep2ListId = "3"
                            const acApiIntegrationStep2AutomationId = "2"
                            await invokeActiveCampaignAddContactToList(acContactId, acApiIntegrationStep2ListId)
                            // await invokeActiveCampaignAddContactToAutomation(acContactId, acApiIntegrationStep2AutomationId) 
                        } else {
                            console.log(`Can't find active_campaign_id for HS contact ${hsContactId}, exiting...`)
                        }
                    } else {
                        console.log(`Can't find associated contact for HS deal ${hsDealId}, exiting...`)
                    }
                }
            }
        } catch (e) {
            console.log(`Error in catch block.\nData: ${data}\nError: ${e.stack}`)
        }
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify('We got your data, thanks!'),
    };
    return response;
};

// HubSpot
function findContactIdByDealId(dealId) {
    const options = {
        hostname: hsApiHost,
        path: `/crm/v3/objects/deals/${dealId}/associations/contacts`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'Authorization': `Bearer ${hsAccessToken}`
        }
    }
    return sendGetRequest(options)
}

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

// AWS
function invokeHubSpotAddOnwerToContact(payload) {
    return new Promise((resolve, reject) => {
        const params = {
            FunctionName: 'HubSpot_Add_Owner_To_Contact',
            InvocationType: 'Event',
            Payload: JSON.stringify(payload)
        };
        
        lambda.invoke(params, (err, results) => {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(`Successfully sent to HubSpot_Add_Owner_To_Contact.`);
                return resolve(results);
            }
        });
    })
}

function invokeHubSpotCreateNewDeal(payload) {
    return new Promise((resolve, reject) => {
        const params = {
            FunctionName: 'HubSpot_Create_New_Deal',
            InvocationType: 'Event',
            Payload: JSON.stringify(payload)
        };
        
        lambda.invoke(params, (err, results) => {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(`Successfully sent to HubSpot_Create_New_Deal.`);
                return resolve(results);
            }
        });
    })
}

function invokeActiveCampaignAddContactToList(contactId, listId) {
    return new Promise((resolve, reject) => {
        const params = {
            FunctionName: 'ActiveCampaign_Add_Contact_To_List',
            InvocationType: 'Event',
            Payload: JSON.stringify({contactId, listId})
        };
        
        lambda.invoke(params, (err, results) => {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(`Successfully sent to ActiveCampaign_Add_Contact_To_List.`);
                return resolve(results);
            }
        });
    })
}

function invokeActiveCampaignAddContactToAutomation(contactId, automationId) {
    return new Promise((resolve, reject) => {
        const params = {
            FunctionName: 'ActiveCampaign_Add_Contact_To_Automation',
            InvocationType: 'Event',
            Payload: JSON.stringify({contactId, automationId})
        };
        
        lambda.invoke(params, (err, results) => {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(`Successfully sent to ActiveCampaign_Add_Contact_To_Automation.`);
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
