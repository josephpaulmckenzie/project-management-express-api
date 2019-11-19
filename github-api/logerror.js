
exports.format = (errorType, errorMessage) => {
    const e = new Error(errorMessage);
    const errorStack = e.stack.split("\n")[2];
    const functionName = errorStack.split(" ")[5];
    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(e.stack.split("\n")[2]);
    const filename = match[1].split("/").pop();
    // console.log("!!!!!", errorType)
    if (errorType == "Error") {
        console.log("Send Message to Error Group");
    }
    return console.log({
        messageType: errorType,
        fileName: filename,
        functionName: functionName,
        line: match[2],
        column: match[3],
        message: e.message
    })
};

