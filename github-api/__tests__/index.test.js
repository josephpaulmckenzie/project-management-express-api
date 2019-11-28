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
