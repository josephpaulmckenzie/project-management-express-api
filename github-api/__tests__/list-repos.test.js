const index = require('../lib/index');
require("dotenv").config();
describe('Github Authorization Header', () => {
  const auth = index.githubAuth(process.env.userAgent, process.env.authorization);
  test('Correct GET method is supplied', () => {
    const method = auth.method;
    expect(method).toBe("GET");
  });
  describe('Github Headers', () => {
    const headers = auth.headers;
    test('Accept header is set to accept application/json', () => {
      const accept = headers.Accept;
      expect(accept).toBe('application/json');
    });
    test('Content-Type header is set to application/json', () => {
      const contentType = headers['Content-Type'];
      expect(contentType).toBe('application/json');
    });
    test('user-agent header is set to application/json', () => {
      const userAgent = headers['user-agent'];
      // Just want to make sure we have a value here because it can change depending on the username used during testing
      expect(typeof userAgent).toBe('string');
    });
    test('Authorization header is base64 encrypted ', () => {
      // Regex magic :P 
      const base64Regex = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;
      const authorization = headers.Authorization;
      // We need to strip out the word Basic to test to see if our authToken is valid base64 encrypted string
      const authToken = authorization.replace("Basic ", "");
      const isBase64Valid = base64Regex.test(authToken);
      // Just want to make sure we have a value here because it can change depending on the token used during testing
      expect(isBase64Valid).toBe(true);
    });
  });
});

describe('Github Account Type', () => {
  test('Account Type is User', async () => {
    const auth = await index.githubAuth(process.env.userAgent, process.env.authorization);
    const accountDetails = await index.getAccountDetails(process.env.userAgent, process.env.userAccount, auth);
    const accountType = accountDetails.type;
    expect(accountType).toBe('User');
  });
});
test('Account Type is Organization', async () => {
  const auth = index.githubAuth(process.env.userAgent, process.env.authorization);
  const accountDetails = await index.getAccountDetails(process.env.userAgent, process.env.orgAccount, auth);
  const accountType = accountDetails.type;
  expect(accountType).toBe('Organization');
});


describe('Github repo list for user Account', () => {
  const githubUsername = process.env.userAgent;
  const githubAuthorization = process.env.authorization;
  const auth = index.githubAuth(githubUsername, githubAuthorization);
  test('Status Code is 200', async () => {
    const accountDetails = await index.getAccountDetails(githubUsername, process.env.userAccount, auth);
    const getReposList = await index.getReposList(auth, githubUsername, githubUsername, accountDetails);
    const statusCode = getReposList.statusCode;
    // Makes sure that we have gotten a 200 response from Github when trying to get a list of repos in
    expect(statusCode).toBe(200);
  });
  test('Repo count is greater than 1', async () => {
    const accountDetails = await index.getAccountDetails(githubUsername, process.env.userAccount, auth);
    const getReposList = await index.getReposList(auth, githubUsername, githubUsername, accountDetails);
    const repoCount = getReposList.user.length;
    // Checks to make sure we have at least 1 repo in the account searched.
    expect(repoCount).toBeGreaterThan(0);
  });
});

describe('Github repo list for Organization  Account', () => {
  const githubUsername = process.env.userAgent;
  const githubAuthorization = process.env.authorization;
  const auth = index.githubAuth(githubUsername, githubAuthorization);
  test('Status Code is 200', async () => {
    const accountDetails = await index.getAccountDetails(githubUsername, process.env.userAccount, auth);
    const accountType = accountDetails.type;
    const getReposList = await index.getReposList(auth, githubUsername, githubUsername, accountDetails);
    const statusCode = getReposList.statusCode;
    const repoCount = getReposList.user.length;
    // Makes sure that we have gotten a 200 response from Github when trying to get a list of repos in
    expect(statusCode).toBe(200);
  });
  test('Repo count is greater than 1', async () => {
    const accountDetails = await index.getAccountDetails(githubUsername, process.env.userAccount, auth);
    const getReposList = await index.getReposList(auth, githubUsername, githubUsername, accountDetails);
    const repoCount = getReposList.user.length;
    // Checks to make sure we have at least 1 repo in the account searched.
    expect(repoCount).toBeGreaterThan(0);
  });
});

