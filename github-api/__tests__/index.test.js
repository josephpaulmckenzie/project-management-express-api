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
    test('Authorization header has Basic ', () => {
      const authorization = headers.Authorization;
      // Just want to make sure we have a value here because it can change depending on the token used during testing
      expect(authorization).toMatch('Basic ');
    });
  });
});

describe('Github Account Type', () => {
  const auth = index.githubAuth(process.env.userAgent, process.env.authorization);
  test('Account Type is User', async () => {
    const accountDetails = await index.getAccountDetails(process.env.userAgent, process.env.accountTypeUser, auth);
    const accountType = accountDetails.type;
    expect(accountType).toBe('User');
  });
  test('Account Type is Organization', async () => {
    const accountDetails = await index.getAccountDetails(process.env.userAgent, process.env.accountTypeOrg, auth);
    const accountType = accountDetails.type;
    expect(accountType).toBe('Organization');
  });
});