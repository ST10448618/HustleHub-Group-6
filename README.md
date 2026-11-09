<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?color=00FF88&size=45&center=true&vCenter=true&width=1000&lines=HUSTLEHUB%2B;Secure+Freelance+Marketplace" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-MERN-00FF88?style=flat-square" />
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/API-Express-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/ODM-Mongoose-880000?style=flat-square" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/Testing-Jest%20%7C%20Vitest%20%7C%20Newman-C21325?style=flat-square&logo=jest&logoColor=white" />
  <img src="https://img.shields.io/badge/Security-DevSecOps-6f42c1?style=flat-square" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" />
  <img src="https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Transport-HTTPS%2FTLS-00A98F?style=flat-square" />
</p>

---

## Demonstration Video

<p align="center">
  <a href="https://youtu.be/jNsRTWMScq4?si=5uziAg8HM-SrVYw0">
    <img src="https://img.shields.io/badge/YouTube-Watch%20Demo-red?style=for-the-badge&logo=youtube&logoColor=white"/>
  </a>
</p>

> Click the badge above to watch a full walkthrough of the HustleHub+ application, covering all core and innovative features.

---

## Backup Project Link

<p align="center">
  <a href="https://github.com/ST10448618/HustleHub">
    <img src="https://img.shields.io/badge/GitHub-Repository-white?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</p>

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) **20.19 or higher** (or 22.12+), which the frontend's Vite 8 toolchain requires
- npm and Git
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account with a cluster, a database user, and Network Access that allows your IP address
- [OpenSSL](https://www.openssl.org/) (only needed to generate the local HTTPS certificate if `backend/certificates/` is missing)

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <repository-folder>   # the folder that contains backend/, frontend/ and postman/
```

### 2. Backend

```bash
cd backend
npm install
```

Create your environment file from the example (it is git-ignored, so a fresh clone does not have one):

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Then edit `backend/.env`:

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` locally |
| `JWT_SECRET` | Token signing secret, **minimum 16 characters** (the server refuses to start without it) |
| `JWT_EXPIRE` | Token lifetime (default `7d`) |
| `BCRYPT_ROUNDS` | Password hashing cost (default `10`) |
| `MONGODB_URI` | Your MongoDB Atlas connection string, ending in `/hustlehub` |
| `CLIENT_ORIGIN` | The frontend's address, exactly `http://localhost:5173` (no trailing slash). CORS allows this single origin |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials for the administrator account |
| `SEED_ADMIN_ON_BOOT` | `true` creates that admin automatically on startup. **Development only** |

**HTTPS certificate.** The certificates are git-ignored. If `backend/certificates/key.pem` and `cert.pem` do not exist, generate a self-signed pair (press Enter through the prompts, using `localhost` as the common name):

```bash
mkdir certificates
openssl req -x509 -newkey rsa:2048 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes
```

Start the API:

```bash
npm run dev
```

It runs at `https://localhost:5000`. Confirm with `https://localhost:5000/health`.

**Administrator account.** Registration can only create Clients and Freelancers. Create the admin with `npm run create-admin` (uses the `ADMIN_*` values), or set `SEED_ADMIN_ON_BOOT=true` for local development.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
```

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

`frontend/.env` holds the one setting the app needs, the API address:

```
VITE_API_BASE_URL=https://localhost:5000/api/v1
```

Vite only reads `.env` when it starts, so restart it after any change. Then run:

```bash
npm run dev
```

Open **http://localhost:5173**.

### 4. Trust the local certificate (once per browser)

Open `https://localhost:5000/health` in the same browser, choose **Advanced → Proceed to localhost**, and confirm you can see a JSON response. Without this step the browser blocks every API call with `ERR_CERT_AUTHORITY_INVALID`.

### 5. Try the full flow

1. Register a **Freelancer** and a **Client** (two accounts), and keep the administrator login handy.
2. As the freelancer, create a gig with a price and a deposit.
3. As the client, open the gig in the marketplace and book it (the deposit is recorded immediately).
4. As the freelancer, open the booking and **Mark as Complete** on or after the service date. The remaining payment is released and appears in Finances and Transactions.
5. As the administrator, watch the dashboard update and review users.

### Useful commands

| Where | Command | What it does |
|---|---|---|
| `backend` | `npm run dev` | Starts the API with automatic restart |
| `backend` | `npm test` | Runs the Jest + Supertest suite (94 tests) against an in-memory MongoDB |
| `backend` | `npm run test:newman` | Runs the Postman collection against the running API |
| `backend` | `npm run create-admin` | Creates the administrator account |
| `frontend` | `npm run dev` | Starts the Vite development server |
| `frontend` | `npm run build` | Produces a production build |
| `frontend` | `npm run lint` | Lints the frontend code |
| `frontend` | `npm test` | Runs the Vitest + React Testing Library suite |

---

## 1. System Overview

HustleHub+ is a secure freelance marketplace platform that connects clients with freelancers. Freelancers advertise their services through gigs, while clients browse available services and create bookings. The platform records simulated financial transactions generated from bookings and shows freelancers their income: total income, deposit income, released income and pending income. (MongoDB, 2023)

The system supports three user roles: **Clients**, **Freelancers** and **Administrators**. Clients use the marketplace and booking functionality, freelancers manage their gigs, bookings and financial information, and administrators manage and oversee the platform.

### 1.1 Features by Role

| Role | What they can do |
|---|---|
| **Visitor** | Browse the marketplace, filter and search gigs, view gig details, register and log in |
| **Client** | Book gigs (the deposit is recorded immediately), view all bookings with status filters, view booking details with a progress timeline, cancel a confirmed booking, see a dashboard of upcoming bookings and recent activity |
| **Freelancer** | Create, edit and delete (deactivate) gigs, see the bookings made on each gig, mark a booking complete once its service date arrives (which releases the remaining payment), view a dashboard, an income summary with charts, and a full transaction history |
| **Administrator** | View a live platform dashboard (statistics, bookings by status, recent activity, refreshed every 30 seconds), manage users (edit name and role, delete users who have no history), and oversee all gigs, bookings and transactions |
| **All signed-in users** | A read-only profile and automatic session handling |

### 1.2 Booking and Payment Lifecycle

A booking is created as **CONFIRMED** and ends as either **COMPLETED** or **CANCELLED**. There is no pending state.

- **Booking created:** the backend calculates the amounts from the gig's price and deposit and records a **Deposit** transaction immediately.
- **Booking completed:** once the service date has arrived, the freelancer (or an administrator) completes the booking and the backend records a **Remaining Payment** transaction. If recording that transaction fails, the completion is rolled back.
- **Booking cancelled:** the client (or an administrator) can cancel a confirmed booking. The deposit is retained and the remaining payment is never released.

All payments are simulated, and transactions are read-only records created only by the backend.

Security is a core requirement because HustleHub+ processes sensitive information, including authentication credentials, user information, roles, bookings, transactions and income-related data. The system therefore uses multiple security controls throughout the application rather than relying on a single security mechanism. (OWASP, 2021)

---

## 2. System Architecture

### 2.1 MERN Architecture

HustleHub+ follows the MERN architecture, consisting of MongoDB, Express, React and Node.js. The React frontend provides the user interface, while the Node.js and Express backend provides the REST API and handles application logic and security. MongoDB Atlas provides the database layer and is accessed through Mongoose. (React, 2024)

The architecture separates the presentation, application, security, business logic and data layers. This separation improves maintainability and allows functionality to be developed and tested without placing all responsibilities within a single component.

### 2.2 System Components

The main components of HustleHub+ are:

- **React Frontend**: A Vite-built single-page application that provides the user interface for authentication, the marketplace, gig management, bookings, financial information and administration (React, 2024).
- **Frontend Service Layer**: One shared API client and one module per resource, so that screens never call the network directly.
- **Node.js and Express API**: Handles HTTP requests, API routes, middleware and communication between the frontend and application logic (ExpressJS, 2024).
- **Security Middleware**: Performs authentication, validation and authorisation-related checks (OWASP, 2021).
- **Controllers**: Receive requests and coordinate the appropriate application operations.
- **Services/Business Logic**: Contains the rules and processing required by the application.
- **Mongoose**: Provides the object modelling layer used to communicate with MongoDB (MongooseJS, 2024).
- **MongoDB Atlas**: Stores application data such as users, gigs, bookings and transactions (MongoDB, 2023).
- **Logging and Monitoring**: Records important application, security and operational events.

### 2.3 Backend Architecture

The backend uses a layered structure. Requests are processed by security middleware before reaching the relevant routes and controllers. Controllers coordinate the request and pass the required operation to the service or business-logic layer. Where data is required, the service communicates with MongoDB through Mongoose.

The API is versioned under `/api/v1` and exposes `auth`, `gigs`, `bookings`, `transactions`, `income` and `admin` resources. This separation gives each backend component a clear responsibility and supports future development because additional functionality can be introduced without placing all application logic directly inside routes or controllers.

### 2.4 Frontend Architecture

The frontend is a React 19 application built with Vite and written in JavaScript, with React Router 7 for navigation. Its structure mirrors the backend's separation of concerns:

```
frontend/src/
├── pages/       Screens, grouped by audience: public, client, freelancer, admin
├── components/  Reusable UI: layout shells, forms, modals, tables, charts, bookings, gigs, admin
├── services/    The shared API client and one module per backend resource
├── context/     Authentication state and the app-wide query cache
├── routes/      The route table and the route guards
├── utils/       Formatting, display helpers and derived-data logic
└── styles/      Design tokens and global styles
```

- **Service layer.** A single axios instance (`services/api.js`) attaches the bearer token to every request, unwraps the API's `{ success, message, data }` envelope, converts failures into one consistent error shape, and handles an expired session in one place. Components never import axios directly.
- **State management.** An authentication context holds the current user and role and provides `login`, `registerThenLogin`, `logout` and session restore. Screens fetch their own data with plain effects. React Query is used in exactly one place, the Administrator dashboard, which polls four endpoints every 30 seconds, pauses while the browser tab is hidden, and has its cache cleared on logout.
- **Routing and layouts.** Public pages share a header and footer that adapts to the signed-in state. Every authenticated page renders inside a shell with a role-based sidebar built from a single configuration. A protected-route component checks authentication and role before any page renders, and sends users to dedicated 403 and 404 pages. A top-level error boundary replaces a crashed screen with a generic error page instead of a blank one.
- **User interface.** Custom CSS built on design tokens, with a reusable component library (forms, modals and confirmation dialogs, data tables, status badges, metric cards, timelines) and Recharts for charts. Every list and detail screen handles loading, empty and error states, and the layout is responsive.
- **Data presentation.** Amounts are shown in whole rand (for example R2,500) and dates in the South African format. Because the API has no pagination, search or reporting endpoints, searching, filtering, sorting, dashboard statistics and chart data are derived in the browser from the lists the API already returns.

### 2.5 System Boundaries

The main HustleHub+ application boundary contains the React frontend, Node.js/Express backend, security controls, business logic and application-level logging.

External services include MongoDB Atlas, cloud logging and monitoring services, and GitHub/GitHub Actions. These services support the application but are not part of the core application codebase.

HTTPS/TLS forms the secure communication boundary between users and the application. The security controls within the backend then determine whether a request is valid and authorised.

---

## 3. Request Flow

A normal request begins when a user interacts with the React frontend. The frontend is responsible for providing the user interface and collecting the information required for a particular operation. Once the user performs an action, such as logging in, viewing a gig, creating a booking or completing one, the frontend sends the required request to the Express API over HTTPS. Using HTTPS ensures that information transmitted between the client and backend is encrypted while travelling across the network.

Within the frontend, every request passes through the single shared API client. It attaches the stored JWT as a Bearer token, and on the way back it unwraps the response envelope and normalises any error, so that every screen receives data or a predictable error object.

When the request reaches the Express backend, it passes through the relevant security middleware before reaching the application route and controller. Middleware provides an important security layer because it allows common checks to be performed consistently across multiple endpoints. Depending on the endpoint, these checks can include authentication, authorisation, rate limiting, input validation, sanitisation and security-related request processing.

For protected resources, the backend first verifies the user's authentication token. The JWT is checked to determine whether it is valid, has not expired and was issued using the application's trusted signing secret. Once the user's identity has been established, additional authorisation checks can be performed. These checks may include role-based access control or ownership verification to determine whether the authenticated user is permitted to perform the requested action. (Auth0, 2024)

After the required security checks succeed, the request is passed to the appropriate controller. The controller manages the request and passes the required operation to the service layer. The service layer contains the application's business logic and helps keep security, routing and business operations separated. When database information is required, the service layer uses Mongoose to communicate with MongoDB Atlas.

The result of the operation is then returned from the service layer to the controller. The controller sends an appropriate HTTP response through the Express API to the React frontend. The frontend processes the response and displays the relevant information or feedback to the user.

This request flow creates a structured separation between the frontend, API, security middleware, controllers, services and database. More importantly, it ensures that security checks occur before protected functionality is executed, reducing the possibility of unauthorised users accessing sensitive operations or data.

---

## 4. Authentication and JWT

### 4.1 Registration

During registration, the user supplies the information required to create an account, such as their name, email address, password and selected user role (Client or Freelancer; the Administrator role can never be chosen at registration). This information is treated as untrusted input and must be validated before being processed by the backend. Validation helps ensure that required fields are present and that information follows the expected application format.

The backend also checks whether an account already exists using the supplied email address. Preventing duplicate accounts helps maintain data integrity and avoids unnecessary authentication conflicts.

The user's password is securely hashed before it is stored in the database. A password hash is a one-way representation of the original password, meaning that the application does not need to retain the user's plaintext password. bcrypt is used to make password storage more resistant to common password-cracking techniques.

Only the resulting password hash is retained in the database. This means that even if stored user information were exposed, the database would not directly contain users' original passwords. Password security is therefore treated as a separate concern from authentication itself.

### 4.2 Login

During login, the user submits their credentials through the React frontend, which sends them to the backend over HTTPS. The backend validates the supplied input before attempting authentication. The relevant user account is then retrieved from MongoDB.

The supplied password is compared against the stored password hash using the password-hashing mechanism. If the credentials are valid, authentication succeeds and the backend generates a JSON Web Token (JWT) representing the authenticated session.

If the credentials are invalid, the backend returns a controlled authentication failure. The response avoids revealing whether the email address or password was specifically incorrect, as providing excessive information can assist attackers in identifying valid accounts.

### 4.3 JWT Generation

A JWT is generated after successful authentication and is used to identify the authenticated user during subsequent protected requests. The token contains only information required by the application, such as a user identifier, role and token-related claims.

Sensitive information, particularly passwords or other confidential user information, is never stored inside the JWT. JWTs are designed to carry authentication-related claims, not to act as secure storage for sensitive information.

The token is digitally signed by the backend, allowing the server to verify that it was generated by a trusted source and has not been modified. Tokens expire after a configurable period (7 days by default), and the server refuses to start unless a signing secret of at least 16 characters is configured.

### 4.4 Protected Requests

For protected API requests, the client sends the JWT using the HTTP Authorization header with the Bearer scheme. The backend verifies the token before allowing access to protected functionality.

JWT authentication establishes the identity of the user, but authentication alone does not determine whether that user should be allowed to perform every operation. Additional controls such as role-based access control and ownership checks determine whether the authenticated user is authorised to perform the requested operation.

This distinction between authentication and authorisation is important within HustleHub+. For example, a valid Freelancer JWT proves that the request belongs to an authenticated Freelancer, but it does not automatically give that user permission to access another user's private resources or perform Admin-only functions.

### 4.5 Frontend Session Handling

After registration, the frontend logs the user in automatically with the credentials just entered, so there is no separate "now log in" step. The token is kept in the browser so that a page refresh does not end the session: on start-up the application checks for a stored token and asks the API who it belongs to, restoring the user and role if the token is still valid.

If the backend ever answers a protected request with 401 (an expired or invalid token), the shared API client removes the stored token and the user is taken to a "session expired" page. Logging out clears the token and, for administrators, the cached dashboard data.

---

## 5. Security Architecture

### 5.1 Password Security

Passwords are securely hashed before storage, and plaintext passwords are never retained by the application. During login, the supplied password is compared against the stored password hash rather than being directly compared with a stored plaintext value.

Password hashing reduces the impact of a potential database compromise because attackers cannot immediately retrieve users' original passwords from the database. Strong password-handling practices therefore provide an important first layer of protection for user accounts and credentials. (NIST, 2020)

### 5.2 Input Validation

All user input is treated as untrusted and must be validated before processing. Validation checks that information follows the expected format and application rules, including required fields, email addresses, passwords, IDs, financial information and other user-supplied values.

Backend validation is particularly important because users can bypass the React frontend and send requests directly to the API. The frontend mirrors the backend's rules (for example title and description length, price greater than zero, and a deposit that does not exceed the price) so that mistakes are shown instantly, but it is a convenience only. The backend re-validates every request and has the final say. (Snyk, 2024)

By performing validation on the backend, HustleHub+ can reject malformed, incomplete or unexpected requests before they reach sensitive business logic or database operations.

### 5.3 Input Sanitisation and Output Encoding

Sanitisation complements validation by reducing potentially harmful content in user-supplied data. This is especially important for information that may later be displayed to other users, such as gig descriptions, profile information or other marketplace content. (OWASP, 2021)

On the backend, text fields are trimmed and email addresses are normalised before storage, and request bodies are limited to 100 KB. The backend deliberately does not HTML-escape text before storing it: escaping at storage time corrupts legitimate characters (an ampersand would be saved as `&amp;` and displayed incorrectly) and ties the stored data to one output format. Protection against XSS-style attacks is instead applied where content is displayed.

React encodes every value rendered through JSX, so gig titles, descriptions and user names are always displayed as text and cannot execute as markup. The frontend never injects raw HTML (`dangerouslySetInnerHTML` is not used anywhere), and the Content Security Policy configured through Helmet provides a further browser-level safeguard. Together, these controls help prevent unsafe content from moving through the application. (OWASP, 2021)

### 5.4 HTTPS/TLS

HTTPS/TLS protects communication between users and the HustleHub+ application. This is important because credentials, JWTs, personal information and transactional data may be transmitted between the client and server. (Cloudflare, 2024)

Encryption of the communication channel reduces the risk of sensitive information being intercepted or modified during transmission. This is particularly important when users access the platform over public or untrusted networks. (Cloudflare, 2024)

The API serves over HTTPS using the configured certificate and key. In production, the server refuses to start if the certificates are missing, so it can never silently fall back to plain HTTP; the HTTP fallback exists only for local development and is clearly logged as insecure. HTTPS protects the communication channel, while JWT provides authentication, so both controls address different security requirements.

### 5.5 RBAC

Role-Based Access Control (RBAC) restricts functionality according to the authenticated user's role. HustleHub+ supports Client, Freelancer and Admin roles, with permissions appropriate to each role.

For example, a client may be permitted to book freelance services, while a Freelancer may manage their own gigs and bookings. Administrative functionality is restricted to Admin users.

RBAC follows the principle of least privilege by preventing users from accessing functionality outside their authorised responsibilities. Role checks are performed on the backend so that users cannot simply modify frontend elements to gain access to restricted functionality. The frontend adds a usability layer on top: the sidebar shows only the items for the signed-in role, and a route guard sends users who open another role's page to an "Access denied" page. These frontend controls only improve the experience, and the backend remains authoritative. (OWASP, 2021)

### 5.6 Ownership Checks

Ownership checks provide protection at the individual resource level. A valid Freelancer JWT should not automatically allow that freelancer to modify another freelancer's gig, profile or other resources.

The backend therefore verifies both the user's identity and whether the requested resource belongs to that user where ownership is required. Only a gig's owner (or an administrator) can edit or delete it, only a booking's own client or freelancer can view it, and transactions are scoped so that each user sees only their own. This provides a more granular security layer than RBAC alone. (Auth0, 2024)

For example, RBAC may establish that a user is a Freelancer and can manage gigs, while an ownership check confirms that the gig being edited belongs to that Freelancer. Combining these controls helps prevent horizontal privilege escalation between users with the same role.

### 5.7 Rate Limiting

Rate limiting restricts excessive requests to the API. It is particularly useful for sensitive endpoints such as authentication endpoints, where repeated automated requests could be used for brute-force attacks or other abusive activity.

HustleHub+ applies three limits per IP address within a 15-minute window: a general limit of 300 requests across the whole API, a stricter limit of 100 requests on the authentication endpoints, and 30 attempts on booking creation. If a threshold is exceeded, additional requests are temporarily rejected and the frontend displays the backend's own message. (Snyk, 2024)

Rate limiting therefore provides an additional layer of protection against excessive or automated requests. It can also help protect application resources from unnecessary traffic and reduce the potential impact of automated attacks.

### 5.8 Security Headers and CORS

Security headers provide additional browser-level protection. Helmet configures security-related HTTP headers, while the Content Security Policy (CSP) restricts which scripts and other resources the browser is allowed to load. (MDN, 2024)

Cross-Origin Resource Sharing is restricted to a single configured frontend origin, so other websites cannot call the API from a visitor's browser. These controls reduce the impact of browser-based attacks by controlling how the browser interprets and executes content received from the application. Security headers therefore complement authentication, validation and sanitisation rather than replacing them.

### 5.9 Secure Error Handling

API errors are controlled so that internal implementation details are not unnecessarily exposed. Responses do not reveal stack traces, internal file paths, database credentials, secret keys or configuration values (Snyk, 2024).

Instead, the backend returns appropriate HTTP status codes and clear but controlled error messages. For example, a failed request can inform the user that authentication failed or that the supplied data is invalid without exposing the underlying implementation details. (Snyk, 2024)

The frontend follows the same principle. Failures appear as friendly messages with a retry option, never as raw error output, and if a screen crashes while rendering, an error boundary shows a generic "Something went wrong" page rather than technical detail.

### 5.10 Token Storage Trade-off

The JWT is stored in the browser's `localStorage` so that a refresh keeps the user signed in. This is a deliberate trade-off: unlike an HttpOnly cookie, it can be read by scripts running on the page, so the application relies on the XSS defences described in section 5.3 (output encoding, no raw HTML injection and a Content Security Policy) to protect it. The token is attached to requests only through the single shared API client, is removed on logout and whenever the API answers 401, and expires automatically.

### 5.11 Administrative Safeguards

Several rules protect the platform from administrative mistakes as well as from attackers:

- The Administrator role cannot be chosen at registration.
- Administrator accounts cannot be edited or deleted through the admin API, and the interface does not offer those actions.
- A user who has any gigs or bookings cannot be deleted, so that history is preserved, and the backend's explanation is shown to the administrator as-is.
- Deleting a gig is a "soft delete": the gig is marked inactive and removed from the marketplace, while existing bookings are unaffected.
- Transactions are read-only and are created only by the backend as a side effect of a booking or its completion.
- Cached administrator data is wiped from the browser when the user logs out.

---

## 6. Security Rationale

The security controls used by HustleHub+ were selected according to the risks associated with processing authentication, user, booking and financial information.

| Security Control          | Purpose                                                       |
|---------------------------|---------------------------------------------------------------|
| Password hashing          | Protects stored credentials                                   |
| JWT authentication        | Identifies authenticated users                                |
| Input validation          | Rejects unexpected or invalid input                           |
| Sanitisation and output encoding | Reduces malicious content and XSS risks                |
| HTTPS/TLS                 | Protects information during transmission                      |
| RBAC                      | Restricts functionality by role                               |
| Ownership checks          | Protects individual user resources                            |
| Rate limiting             | Reduces excessive and automated requests                      |
| Security headers and CORS | Provides additional browser protection                        |
| Secure error handling     | Reduces information leakage                                   |
| Route guards (frontend)   | Keeps users on pages that match their role                    |
| Session expiry handling   | Clears invalid tokens and ends stale sessions                 |
| Administrative safeguards | Protects admin accounts and user history                      |

These controls provide defence in depth. Multiple security mechanisms operate at different stages of a request, meaning the system does not depend on a single control to protect sensitive functionality.

---

## 7. DevSecOps / CI‑CD Overview

Security and testing are incorporated into the development lifecycle through a GitHub Actions CI/CD pipeline. Rather than treating security as a final step before deployment, HustleHub+ integrates testing and security checks throughout the development and delivery process. (Snyk, 2024)

The pipeline can perform backend and frontend unit testing to verify that individual components behave as expected. The backend uses Jest with Supertest, and the frontend uses Vitest with React Testing Library. Automated testing helps identify defects early and reduces the likelihood of introducing regressions when new functionality is added. (Jest, 2024)

Newman can also be used to execute automated API endpoint tests against the Express backend. These tests can verify authentication, authorisation, validation and expected API responses. This provides an additional level of confidence that security controls continue to operate correctly as the application develops. (Snyk, 2024)

Static analysis and security checks can also be incorporated into the pipeline. These include linting of the frontend code and a production build to catch compile-time problems, as well as checks for coding issues and insecure dependencies. (GitHub, 2024) Automated checks provide developers with earlier feedback, allowing issues to be addressed before they reach production.

Only when the required checks succeed should the application proceed towards the build stage. Successful pipeline execution can then lead to Docker image creation and containerisation of the application. Containerisation provides a consistent environment for packaging and running the application and helps reduce differences between development and deployment environments.

The CI/CD pipeline therefore supports the DevSecOps approach by integrating development, testing, security and deployment into a continuous process. This reduces reliance on manual security checks and encourages security to be considered throughout the software development lifecycle.

The final architecture treats testing, security analysis and deployment processes as connected parts of the application's lifecycle rather than activities performed only at the end of development. This approach supports a more reliable and secure application while allowing the HustleHub+ team to identify and address issues earlier in the development process.

### 7.1 Testing Summary

| Layer | Tooling | Coverage |
|---|---|---|
| Backend unit and integration | Jest, Supertest, in-memory MongoDB | 94 tests across authentication, gigs, bookings, income, administration and the health check |
| API contract | Postman collection run with Newman | Endpoint behaviour, validation and authorisation responses |
| Frontend | Vitest, React Testing Library | Authentication flow, role-based navigation, validation, booking and completion rules, and loading, empty and error states, with the service layer mocked |
| Static checks | oxlint, production build | Code quality and compile-time errors |

---

## 8. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Browser console shows `ERR_CERT_AUTHORITY_INVALID` | The self-signed certificate is not trusted yet. Open `https://localhost:5000/health`, choose **Advanced → Proceed**, then retry |
| `blocked by CORS policy` | `CLIENT_ORIGIN` must equal the address in the browser exactly (`http://localhost:5173`). After editing `backend/.env`, restart the backend (`nodemon` does not watch `.env`) |
| Requests go to `localhost:5173` and return 404 | `frontend/.env` is missing or Vite was not restarted after it was created. Recreate it from `.env.example` and restart `npm run dev` |
| Backend exits with `querySrv ECONNREFUSED` | Some networks refuse the DNS lookup used by `mongodb+srv://` strings. The backend retries once automatically using public DNS. If it still fails, use the standard `mongodb://` connection string from Atlas (Connect → Drivers, older driver version) or change your network's DNS |
| `Server selection timed out` | Your IP address is not allowed in Atlas. Add it under **Network Access** |
| `Too many requests` | A rate limit was reached. Wait up to 15 minutes, and avoid keeping several administrator dashboard tabs open, since each polls every 30 seconds |
| `JWT_SECRET is missing or too short` | Set a `JWT_SECRET` of at least 16 characters in `backend/.env` |

---

<p align="center">
  INSY7314 · Group 6 · 2026
</p>
