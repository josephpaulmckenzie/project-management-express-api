
var base64Regex = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;
const basicAuthToken = "Basic f0b5171029b4d0ba80e2d8ace845ff93ad8f4b0c";
const authToken = basicAuthToken.replace("Basic ", "");
var isBase64Valid = base64Regex.test(authToken);

console.log(isBase64Valid);