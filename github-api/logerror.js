// Will send a message to a sns topic that will send out a text, email, slack or whatever else we want to.
// We can bypass sns and just send to what we want but putting it into a sns topic allows us to quickly
// add or change who or what the alert message goes to 

const sendAlertMessage = async (message) => {
    const messageType = message.messageType
    console.log(`Sending alert message for logs to ${messageType} group`)
}


const error = async (message, statusCode) => {
    const e = new Error(message);
    const errorStack = e.stack.split("\n")[2];
    const functionName = errorStack.split(" ")[5];
    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(e.stack.split("\n")[2]);
    const filename = match[1].split("/").pop();
    const logMessage = {
        messageType: "Error",
        fileName: filename,
        functionName: functionName,
        line: match[2],
        column: match[3],
        message: e.message,
        statusCode: statusCode || 400
    }

    sendAlertMessage(logMessage);
    return console.error(logMessage)
}

const warning = async (message, statusCode) => {
    const e = new Error(message);
    const errorStack = e.stack.split("\n")[2];
    const functionName = errorStack.split(" ")[5];
    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(e.stack.split("\n")[2]);
    const filename = match[1].split("/").pop();
    const logMessage = {
        messageType: "Warning",
        fileName: filename,
        functionName: functionName,
        line: match[2],
        column: match[3],
        message: e.message,
        statusCode: statusCode || 200
    }
    sendAlertMessage(logMessage);
    return console.warn(logMessage)
}

const info = async (message, statusCode) => {
    const e = new Error(message);
    const errorStack = e.stack.split("\n")[2];
    const functionName = errorStack.split(" ")[5];
    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(e.stack.split("\n")[2]);
    const filename = match[1].split("/").pop();
    const logMessage = {
        messageType: "Info",
        fileName: filename,
        functionName: functionName,
        line: match[2],
        column: match[3],
        message: e.message,
        statusCode: statusCode || 200
    }

    return console.info(logMessage)
}


module.exports.info = info;
module.exports.warning = warning;
module.exports.error = error;



