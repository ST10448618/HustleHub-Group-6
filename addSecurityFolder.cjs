// addSecurityFolder.cjs - run from the repo root:  node addSecurityFolder.cjs
// Adds a "Security Features" folder to the Postman collection that
// demonstrates account lockout and token revocation end to end.
// Requires the runId patch (unique emails per run) to be applied first.
const fs = require('fs');
const file = 'postman/HustleHubPlus.postman_collection.json';
const collection = JSON.parse(fs.readFileSync(file, 'utf8'));

if (collection.item.some((folder) => folder.name === 'Security Features')) {
  console.log('Security Features folder already present - nothing to do.');
  process.exit(0);
}

const json = { options: { raw: { language: 'json' } } };
const jsonHeader = [{ key: 'Content-Type', value: 'application/json' }];
const url = (path) => ({
  raw: `{{baseUrl}}/${path.join('/')}`,
  host: ['{{baseUrl}}'],
  path
});
const tests = (status, extra = []) => [
  `pm.test("Status code is ${status}", function () { pm.response.to.have.status(${status}); });`,
  ...extra
];
const item = (name, request, exec, description) => ({
  name,
  request: { ...request, ...(description ? { description } : {}) },
  response: [],
  event: [{ listen: 'test', script: { type: 'text/javascript', exec } }]
});
const post = (path, body, headers = jsonHeader) => ({
  method: 'POST',
  header: headers,
  url: url(path),
  body: { mode: 'raw', raw: JSON.stringify(body, null, 2), ...json }
});

const lockEmail = 'lockout.{{runId}}@hustlehub.test';
const sessionEmail = 'session.{{runId}}@hustlehub.test';
const password = 'Test123456!';

const wrongAttempts = [1, 2, 3, 4, 5].map((n) =>
  item(
    `Login - Wrong Password (attempt ${n} of 5)`,
    post(['auth', 'login'], { email: lockEmail, password: 'WrongPassword1!' }),
    tests(401, ['pm.test("success is false", function () { pm.expect(pm.response.json().success).to.be.false; });'])
  )
);

const folder = {
  name: 'Security Features',
  description:
    'Demonstrates the two extra security features: account lockout after repeated failed logins, and token revocation on logout.',
  item: [
    item(
      'Register - Lockout Test User',
      post(['auth', 'register'], { name: 'Lockout Tester', email: lockEmail, password, role: 'CLIENT' }),
      tests(201)
    ),
    ...wrongAttempts,
    item(
      'Login - Correct Password While Locked (rejected)',
      post(['auth', 'login'], { email: lockEmail, password }),
      tests(423, [
        'pm.test("success is false", function () { pm.expect(pm.response.json().success).to.be.false; });',
        'pm.test("message says the account is locked", function () { pm.expect(pm.response.json().message).to.match(/locked/i); });'
      ]),
      'Five consecutive failures lock the account. Even the CORRECT password is refused with 423 until the lock expires.'
    ),
    item(
      'Register - Logout Test User',
      post(['auth', 'register'], { name: 'Session Tester', email: sessionEmail, password, role: 'CLIENT' }),
      tests(201)
    ),
    item(
      'Login - Logout Test User',
      post(['auth', 'login'], { email: sessionEmail, password }),
      tests(200, [
        'pm.collectionVariables.set("logoutToken", pm.response.json().data.token);'
      ])
    ),
    item(
      'Get Current User - Before Logout',
      { method: 'GET', header: [{ key: 'Authorization', value: 'Bearer {{logoutToken}}' }], url: url(['auth', 'me']) },
      tests(200)
    ),
    item(
      'Logout (revokes the token)',
      { method: 'POST', header: [{ key: 'Authorization', value: 'Bearer {{logoutToken}}' }], url: url(['auth', 'logout']) },
      tests(200, ['pm.test("success is true", function () { pm.expect(pm.response.json().success).to.be.true; });'])
    ),
    item(
      'Get Current User - After Logout (revoked token rejected)',
      { method: 'GET', header: [{ key: 'Authorization', value: 'Bearer {{logoutToken}}' }], url: url(['auth', 'me']) },
      tests(401, [
        'pm.test("message says the session has ended", function () { pm.expect(pm.response.json().message).to.match(/session has ended/i); });'
      ]),
      'The token is still correctly signed and unexpired, but its id is on the revocation list.'
    )
  ]
};

collection.item.push(folder);
fs.writeFileSync(file, JSON.stringify(collection, null, 2));
console.log(`Added "Security Features" folder with ${folder.item.length} requests.`);