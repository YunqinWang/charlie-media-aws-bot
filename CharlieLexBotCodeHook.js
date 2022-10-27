// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled
function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
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
function dispatch(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes;
    switch(intentRequest.currentIntent.name){
        case "InitialIntent":
            InitialIntent(intentRequest, callback);
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
            elicitFirstName(intentRequest, callback);
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

        case "SpecificServiceIntent":
            SpecificServiceIntent(intentRequest, callback);
            break;
        default:
            callback(close(sessionAttributes, 'Fulfilled',
            {'contentType': 'PlainText', 'content': `Okay`}))
            return;
    }
}


function InitialIntent(intentRequest, callback){
    console.log("initial",intentRequest)
    let sessionAttributes = intentRequest.sessionAttributes;
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
    sessionAttributes = Object.assign(sessionAttributes,{"generalService":next});
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
            console.log("Tell me more")
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
        case "Discuss project with us":
            console.log("Discuss project")
            callback(elicitSlot(
                sessionAttributes, 
                "ProjectIntent",
                {"FirstNameSlot": null,
                 "EmailSlot": null},
                "FirstNameSlot",
                {
                    "contentType":"PlainText",
                    "content":"Great! Let's get some more information to make that connection. What's your name?"
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
    console.log(slots)
    switch(next){
        case "Discuss project with us":
            elicitFirstName(intentRequest, callback);         
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
function elicitFirstName(intentRequest, callback){
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    console.log("Discuss project")
    callback(elicitSlot(
        sessionAttributes, 
        "ProjectIntent",
        {"FirstNameSlot": null,
         "EmailSlot": null},
        "FirstNameSlot",
        {
            "contentType":"PlainText",
            "content":"Great! Let's get some more information to make that connection. What's your name?"
        }
    ));
}

//ask for first name and last name
function ProjectIntent(intentRequest, callback){
    console.log(JSON.stringify(intentRequest));
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    
    //after asking for first name, set the FirstNameSlot slot value 
    //and ask for the last name
    if (slots.FirstNameSlot==null) {
        slots.FirstNameSlot = intentRequest.inputTranscript;
        sessionAttributes=Object.assign(sessionAttributes,{"firstName":slots.FirstNameSlot});
        callback(elicitSlot(
            sessionAttributes, 
            "ProjectIntent",
            {"FirstNameSlot": intentRequest.inputTranscript,
             "EmailSlot": null},
            "EmailSlot",
            {
                "contentType":"PlainText",
                "content":"What is the best email address for one of our team members to reach you?"
            }
        ))
    }
    
    //after asking for the last name, set the EmailSlot slot value
    //and elicit SpecificServiceIntent
    else {
        slots.EmailSlot = intentRequest.inputTranscript;
        sessionAttributes=Object.assign(sessionAttributes,{"email":slots.EmailSlot});
        callback(elicitSlot(
            sessionAttributes, 
            "SpecificServiceIntent",
            {"SpecificServiceSlot": null},
            "SpecificServiceSlot",
            {
                "contentType":"PlainText",
                "content":"What service are you specifically interested in connecting with us about?"
            }
        ))
    };             
}


function DomainIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    slots.DomainSlot = intentRequest.inputTranscript;
    sessionAttributes=Object.assign(sessionAttributes,{"domain":slots.DomainSlot});
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
    sessionAttributes = Object.assign(sessionAttributes,{"website":next});
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
    sessionAttributes = Object.assign(sessionAttributes,{"app":next});
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
    sessionAttributes = Object.assign(sessionAttributes,{"appProject":next});
    elicitTimelineIntent(sessionAttributes, callback);  
}

function APIIntent(intentRequest, callback){
    console.log(intentRequest);
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const next = slots.APISlots;
    sessionAttributes = Object.assign(sessionAttributes,{"API":next});
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
    sessionAttributes=Object.assign(sessionAttributes,{"APIMessage":slots.ElseToKnowSlot});
    elicitTimelineIntent(sessionAttributes, callback);
}
    
function OtherServiceIntent(intentRequest, callback){
    let sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    
    slots.OtherServiceSlot = intentRequest.inputTranscript;
    sessionAttributes=Object.assign(sessionAttributes,{"otherService":slots.OtherServiceSlot});
    elicitTimelineIntent(sessionAttributes, callback);
}


//close the conversation
function SpecificServiceIntent(intentRequest, callback){
    const slots = intentRequest.currentIntent.slots;
    let sessionAttributes = intentRequest.sessionAttributes;
    sessionAttributes=Object.assign(sessionAttributes,{"specificService":slots.SpecificServiceSlot});
    
    callback(close(sessionAttributes, 'Fulfilled',
    {'contentType': 'PlainText', 'content': `Terrific! Our awesome team member, Somer Baier, will email you soon to share further information on these services & coordinate next steps! 🙂`}));
    
}
 


// --------------- Main handler -----------------------
 
// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};

