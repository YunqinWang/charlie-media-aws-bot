const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({ region: "us-east-1" })

// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled
function close(sessionAttributes, fulfillmentState, message) {
    // const hubSpotContactAnswer = await invokeHubSpotCreateContact(sessionAttributes)
    //await invokeHubSpotWebhooksPassthrough(hubSpotContactAnswer)
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

//invoke lambda function HubSpot_Create_New_Contact
function invokeHubSpotCreateContact(payload) {
    console.log("payload: " + JSON.stringify(payload));
    return new Promise((resolve, reject) => {
        const params = {
            FunctionName: 'HubSpot_Create_New_Contact',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload)
        };
        
        lambda.invoke(params, (err, results) => {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(`Successfully sent to HubSpot_Create_New_Contact.`);
                return resolve(results);
            }
        });
    })
}


//invoke lambda function HubSpot_Webhooks_Passthrough
function invokeHubSpotWebhooksPassthrough(payload) {
    console.log("payload: " + JSON.stringify(payload));
    return new Promise((resolve, reject) => {
        const params = {
            FunctionName: 'HubSpot_Webhooks_Passthrough',
            InvocationType: 'Event',
            Payload: JSON.stringify(payload)
        };
        
        lambda.invoke(params, (err, results) => {
            if (err) {
                console.log(err, err.stack);
                return reject(err)
            } else {
                console.log(`Successfully sent to HubSpot_Webhooks_Passthrough.`);
                return resolve(results);
            }
        });
    })
}

// Elicit the next slot
function elicitSlot(sessionAttributes, intentName, slots,slotToElicit,message,responseCard) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
            responseCard
          }
    } ;
}

// --------------- Events -----------------------

//check which intent is this
function dispatch(intentRequest,context,callback) {
    const sessionAttributes = intentRequest.sessionAttributes;
    switch(intentRequest.currentIntent.name){
        case "InitialIntent":
            InitialIntent(intentRequest, context, callback);
            break;
        case "GreetingIntent":
            GreetingIntent(intentRequest, callback);
            break;
        case "LearnMoreIntent":
            LearnMoreIntent(intentRequest, callback);
            break;
        case "TellMoreIntent":
            TellMoreIntent(intentRequest, callback);
            break;
        case "ProjectIntent":
            ProjectIntent(intentRequest, callback);
            break;
        case "DomainIntent":
            DomainIntent(intentRequest, callback);
            break;
        case "WebsiteIntent":
            WebsiteIntent(intentRequest, callback);
            break;
        case "TimelineIntent":
            elicitName(intentRequest, callback);
            break;
        case "AppIntent":
            AppIntent(intentRequest, callback);
            break;
        case "AppProjectAboutIntent":
            AppProjectAboutIntent(intentRequest, callback);
            break;
        case "APIIntent":
            APIIntent(intentRequest, callback);
            break;
        case "ElseToKnowIntent":
            ElseToKnowIntent(intentRequest, callback);
        case "OtherServiceIntent":
            OtherServiceIntent(intentRequest, callback);
        case "EmailIntent":
            EmailIntent(intentRequest, callback);
            break;
        default:
            callback(close(sessionAttributes, 'Fulfilled',
            {'contentType': 'PlainText', 'content': `Okay`}))
            return;
    }
}


function InitialIntent(intentRequest, context, callback){
    console.log(context.awsRequestId);
    let sessionAttributes = {
        id: context.awsRequestId,
        firstName :"",
        lastName:"",
        email:"",
        generalService:"",
        dueDate:"",
        domain:"",
    };
    callback(elicitSlot(
        sessionAttributes,
        "GreetingIntent",
        {"GeneralServiceSlots": null},
        "GeneralServiceSlots",
        {
            "contentType": "PlainText",
            "content":"How can we help you today?"
        }
    ))
}


//options:
//Learn more about Charlie Media
//Need website 
//Need web/mobile app 
//Need API integrations
//Other
function GreetingIntent(intentRequest, callback){
    console.log("greeting",intentRequest);

    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.GeneralServiceSlots;
    sessionAttributes.generalService=next;
    switch(next){
        case "Learn more about Charlie Media":
            callback(elicitSlot(
                sessionAttributes,
                "LearnMoreIntent",
                {"LearnMoreSlot": null},
                "LearnMoreSlot",
                {
                    "contentType": "PlainText",
                    "content":"Charlie Media was founded by Jiangsha Meng in 2021. \nFast forward to 2022 and Impulse Creative is home to over 45 Awesome Humans who are dedicated to helping our clients grow smarter."
                }
            ));
            // "content": "{\"messages\":[{\"type\":\"PlainText\",\"group\":1,\"value\":\"Hello\"},{\"type\":\"PlainText\",\"group\":2,\"value\":\"Hey\"}]}"
            break;
        
        case "Need website help":
            callback(elicitSlot(
                sessionAttributes,
                "DomainIntent",
                {"DomainSlot": null},
                "DomainSlot",
                {
                    "contentType": "PlainText",
                    "content":"Awesome, do you have an existing domain?"
                }
            ));
            break;

        case "Need web/mobile app":
            callback(elicitSlot(
                sessionAttributes,
                "AppIntent",
                {"AppSlot": null},
                "AppSlot",
                {
                    "contentType": "PlainText",
                    "content":"Awesome, what type of development are you looking for?"
                }
            ));
            break;

        case "Need API integrations":
            callback(elicitSlot(
                sessionAttributes,
                "APIIntent",
                {"APISlot": null},
                "APISlot",
                {
                    "contentType": "PlainText",
                    "content":"Great, what's your project about?"
                }
            ));
            break;

        case "Need help with something else":
            callback(elicitSlot(
                sessionAttributes,
                "OtherServiceIntent",
                {"OtherServiceSlot": null},
                "OtherServiceSlot",
                {
                    "contentType": "PlainText",
                    "content":"Got it. In a few sentences, can you tell us what your project is about?"
                }
            ));
            break;
        
        default:
            callback(close(sessionAttributes, 'Fulfilled',
            {'contentType': 'PlainText', 'content': `Okay, you need ${next}.`}));
    }
}

//options:
//Tell me more
//Back to the beginning
//Discuss project with us
function LearnMoreIntent(intentRequest, callback){
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.LearnMoreSlot;
    switch(next){
        case "Tell me more":
            callback(elicitSlot(
                sessionAttributes,
                "TellMoreIntent",
                {"TellMoreSlot": null},
                "TellMoreSlot",
                {
                    "contentType":"PlainText",
                    "content":"We're a proud HubSpot Elite Partner and have been a dedicated member of the HubSpot Partner Program since 2012.We also build some pretty crazy (awesome) stuff on HubSpot that most people don't think is possible 😎 You can read more about us here!"
                }
            ));             
            break;
        case "Back to the beginning":
            callback(elicitSlot(
                sessionAttributes, 
                "GreetingIntent",
                {"GeneralServiceSlots": null},
                "GeneralServiceSlots",
                {
                    "contentType":"PlainText",
                    "content":"How can we help you today?"
                }
            ));             
            break;  
        
        default:
            callback(close(sessionAttributes, 'Fulfilled',
            {'contentType': 'PlainText', 'content': `Okay, you need ${next} `}));
    }
}

//options:
//Discuss project with us
//Back to the beginning
function TellMoreIntent(intentRequest, callback){
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.TellMoreSlot;
    switch(next){
        // case "Discuss project with us":
        //     elicitName(intentRequest, callback);         
        //     break;
        case "Back to the beginning":
            callback(elicitSlot(
                sessionAttributes, 
                "GreetingIntent",
                {"GeneralServiceSlots": null},
                "GeneralServiceSlots",
                {
                    "contentType":"PlainText",
                    "content":"How can we help you today?"
                }
            ));             
            break; 
        default:
            callback(close(sessionAttributes, 'Fulfilled',
            {'contentType': 'PlainText', 'content': `Okay, you need ${next} `}));
    }
}
function elicitName(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    if(slots.TimelineSlot){
        const next = slots.TimelineSlot;
        sessionAttributes.dueDate=next;
    }
    callback(elicitSlot(
        sessionAttributes, 
        "ProjectIntent",
        {"FirstNameSlot": null,
         "LastNameSlot": null
    },
        "FirstNameSlot",
        {
            "contentType":"PlainText",
            "content":"Great! Let's get some more information to make that connection. What's your first name?"
        }
    ));
}

//ask for first name and last name
function ProjectIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    let slots = intentRequest.currentIntent.slots; 

    //after asking for first name, set the FirstNameSlot slot value 
    //and ask for the last name
    if (sessionAttributes.firstName=="") {
        slots.FirstNameSlot = intentRequest.inputTranscript;
        sessionAttributes.firstName=slots.FirstNameSlot;
        callback(elicitSlot(
            sessionAttributes, 
            "ProjectIntent",
            {"FirstNameSlot": intentRequest.inputTranscript,
             "LastNameSlot": null
             },
            "LastNameSlot",
            {
                "contentType":"PlainText",
                "content":"What is your last name?"
            }
        ))
    }
    else {
        sessionAttributes.lastName= intentRequest.inputTranscript;
        callback(elicitSlot(
            sessionAttributes, 
            "EmailIntent",
            { "EmailSlot": null},
            "EmailSlot",
            {
                "contentType":"PlainText",
                "content":"What is the best email address for one of our team members to reach you?"
            }
        ))
    }      
}


function DomainIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    slots.DomainSlot = intentRequest.inputTranscript;
    sessionAttributes.domain=slots.DomainSlot;
    callback(elicitSlot(
        sessionAttributes, 
        "WebsiteIntent",
        {"WebsiteSlot": null},
        "WebsiteSlot",
        {
            "contentType":"PlainText",
            "content":"What are you looking to accomplish with the website?"
        }
    ))
}

function WebsiteIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.WebsiteSlots;
    sessionAttributes.generalService= sessionAttributes.generalService + "--" + next;
    elicitTimelineIntent(sessionAttributes, callback);  
}

function elicitTimelineIntent(sessionAttributes, callback){
    callback(elicitSlot(
        sessionAttributes,
        "TimelineIntent",
        {"TimelineSlot": null},
        "TimelineSlot",
        {
            "contentType":"PlainText",
            "content":"How quickly are you looking to have the project done?"
        }
    )); 
}

function AppIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.AppSlots;
    sessionAttributes.generalService= sessionAttributes.generalService + "--" + next;
    callback(elicitSlot(
        sessionAttributes,
        "AppProjectAboutIntent",
        {"AppProjectAboutSlot": null},
        "AppProjectAboutSlot",
        {
            "contentType":"PlainText",
            "content":"What's the project about?"
        }
    ));  
}


function AppProjectAboutIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.AppProjectAboutSlots;
    sessionAttributes.generalService= sessionAttributes.generalService + "--" + next;
    elicitTimelineIntent(sessionAttributes, callback);  
}

function APIIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.APISlots;
    sessionAttributes.generalService= sessionAttributes.generalService + "--" + next;
    callback(elicitSlot(
        sessionAttributes,
        "ElseToKnowIntent",
        {"ElseToKnowSlot": null},
        "ElseToKnowSlot",
        {
            "contentType":"PlainText",
            "content":"What else do we need to know about your project? (reply to this message)"
        }
    ));  
}

function ElseToKnowIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    
    slots.ElseToKnowSlot = intentRequest.inputTranscript;
    sessionAttributes.generalService= sessionAttributes.generalService + "--" + slots.ElseToKnowSlot;
    elicitTimelineIntent(sessionAttributes, callback);
}
    
function OtherServiceIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    
    slots.OtherServiceSlot = intentRequest.inputTranscript;
    sessionAttributes.generalService= sessionAttributes.generalService + "--" + slots.OtherServiceSlot;
    elicitTimelineIntent(sessionAttributes, callback);
}


//close the conversation
function EmailIntent(intentRequest, callback){
    console.log("email intent")
    
    let sessionAttributes = intentRequest.sessionAttributes;
    sessionAttributes.email= intentRequest.inputTranscript;

    console.log(sessionAttributes)

    callback(close(sessionAttributes, 'Fulfilled',
    {'contentType': 'PlainText', 'content': `Terrific! Our awesome team member, Somer Baier, will email you soon to share further information on these services & coordinate next steps! 🙂`}));
    
}
 


// --------------- Main handler -----------------------
 
// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        dispatch(event,context, 
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};

