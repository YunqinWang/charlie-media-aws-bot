// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled ("Thanks, your pizza will arrive in 20 minutes")
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

// --------------- Events -----------------------
 
function dispatch(intentRequest, callback) {
    const sessionAttributes = intentRequest.sessionAttributes;
    switch(intentRequest.currentIntent.name){
        case "GreetingIntent":
            GreetingIntent(intentRequest, callback);
            break;
        default:
            callback(close(sessionAttributes, 'Fulfilled',
            {'contentType': 'PlainText', 'content': `Okay`}));
            return;
    }
    
}

function GreetingIntent(intentRequest, callback){
    console.log(`request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const service = slots.GeneralServiceSlots;
    
    console.log(service);
    
    callback(close(sessionAttributes, 'Fulfilled',
    {'contentType': 'PlainText', 'content': `Okay, you need ${service} `}));
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

