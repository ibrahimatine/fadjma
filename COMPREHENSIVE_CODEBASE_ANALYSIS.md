# FADJMA Codebase Comprehensive Analysis

## Executive Summary

**Project**: FADJMA - Fully Auditable Digital Journal for Medical Archives
**Status**: Production-ready with Docker support
**Tech Stack**: Node.js/Express (Backend), React (Frontend), Hedera Blockchain, PostgreSQL/SQLite, Socket.io
**Code Size**: ~17K lines of backend code, ~15 pages, 16+ component categories

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Overall Project Structure

```
fadjma/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/            # Configuration (DB, Hedera, KMS)
│   │   ├── controllers/       # Business logic handlers (8 files)
│   │   ├── middleware/        # Auth, validation, logging (7 files)
│   │   ├── models/            # Sequelize ORM (14 database models)
│   │   ├── routes/            # API endpoints (13 route files)
│   │   ├── services/          # Business services (22 files)
│   │   ├── utils/             # Utilities & helpers (6 files)
│   │   ├── websocket/         # Real-time communication
│   │   └── app.js             # Express app configuration
│   ├── server.js              # Server entry point with HTTP/Socket.io
│   ├── migrations/            # Database migrations
│   ├── tests/                 # Jest test suite
│   ├── package.json           # Dependencies
│   ├── Dockerfile             # Container configuration
│   └── database.sqlite        # Development database
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # React components (16+ categories)
│   │   ├── pages/             # Page components (15 pages)
│   │   ├── services/          # API clients & utilities (11 services)
│   │   ├── contexts/          # React context (Auth)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── styles/            # Tailwind CSS config
│   │   ├── utils/             # Helper functions
│   │   └── App.jsx            # Main app component
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   ├── Dockerfile             # Container configuration
│   └── nginx.conf             # Production web server
├── docker-compose.yml         # Multi-container orchestration
├── .env & .env.example        # Environment configuration
└── docs/                      # Documentation

```

### 1.2 Main Technologies & Frameworks

#### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18 (Web framework)
- **Database**: Sequelize 6.35 (ORM) + PostgreSQL 15 / SQLite
- **Blockchain**: @hashgraph/sdk 2.45 (Hedera integration)
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Security**: bcryptjs, helmet, express-validator
- **Real-time**: Socket.io 4.8 (WebSocket)
- **Logging**: Winston 3.17
- **Testing**: Jest 29.7, Supertest 6.3

#### Frontend Stack
- **Framework**: React 18.3 with React Router 6.30
- **State Management**: React Context + @tanstack/react-query 5.62
- **HTTP Client**: Axios 1.12
- **UI Framework**: Tailwind CSS 3.4
- **Components**: Headless UI, Lucide Icons
- **Forms**: react-hook-form 7.62
- **Notifications**: react-hot-toast 2.6
- **Real-time**: Socket.io-client 4.8

#### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Production Server**: Nginx (reverse proxy)
- **Process Manager**: Node.js built-in HTTP server
- **Environment**: .env configuration

### 1.3 Architectural Patterns

#### Backend Architecture
- **Layered Architecture**: Controllers → Services → Models → Database
- **RESTful API Design**: Resource-oriented endpoints
- **Middleware Pattern**: Authentication, validation, error handling
- **Service Layer Pattern**: Business logic isolated in services
- **Data Access Pattern**: Sequelize ORM with relationships
- **Rate Limiting**: Per-user rate limiting on Hedera operations
- **Caching Strategy**: In-memory batching for Hedera anchoring
- **Real-time Events**: Socket.io for live updates

#### Frontend Architecture
- **Component-Based**: Modular React components
- **Code Splitting**: Lazy-loaded pages for performance
- **Context API**: Centralized authentication state
- **Custom Hooks**: Reusable logic (useAuth, useWebSocket, useAccessRequestNotifications)
- **Service Layer**: Separated API calls and business logic
- **Protected Routes**: Role-based access control at UI level

---

## 2. BACKEND ANALYSIS

### 2.1 API Endpoints & Routes

The backend exposes **13 main route modules** with 80+ total endpoints:

#### Authentication Routes (`/api/auth`)
- `POST /register` - User registration (patient, doctor, pharmacy)
- `POST /login` - User authentication
- `GET /me` - Get current user profile
- `POST /logout` - Logout
- `GET /verify-patient-identifier/:identifier` - Verify patient identifier format
- `POST /link-patient-identifier` - Link patient to existing account

#### Medical Records Routes (`/api/records`)
- `GET /` - List all records (filtered by access)
- `GET /:id` - Get specific record
- `GET /grouped-by-patient` - Records grouped by patient
- `GET /:id/prescriptions` - Get prescriptions for a record
- `POST /` - Create new medical record (with Hedera anchoring)
- `PUT /:id` - Update medical record
- `DELETE /:id` - Delete medical record
- `GET /stats` - Doctor dashboard statistics

#### Verification Routes (`/api/verify`)
- `POST /record/:id` - Verify medical record on Hedera
- `GET /record/:id` - Get detailed verification info
- `GET /prescription/:matricule` - Verify prescription authenticity
- `GET /hashscan-info` - Get HashScan blockchain explorer info
- `GET /hcs-status/:transactionId` - Check HCS transaction status
- `GET /topic-stats/:topicId` - Get Hedera topic statistics
- `GET /demo-links` - Verification demo links

#### Prescription Routes (embedded in records)
- `GET /:id/prescriptions` - List prescriptions
- Prescription status tracking with matricules

#### Access Control Routes (`/api/access-requests`)
- `POST /` - Create access request (doctor requests patient data access)
- `GET /` - List access requests
- `GET /:id` - Get specific request
- `PUT /:id` - Approve/reject access request
- `DELETE /:id` - Cancel request
- `GET /patient/:patientId` - Requests for specific patient
- `GET /requester/:requesterId` - Requests by specific doctor
- `GET /check/:patientId` - Check access for patient

#### Pharmacy Routes (`/api/pharmacy`)
- Prescription delivery tracking
- Medication traceability

#### Patient Routes (`/api/patients`)
- `GET /` - List all patients (admin)
- `GET /accessible-patients` - Patients accessible to current doctor
- `GET /unclaimed/my` - Doctor's unclaimed patient profiles
- `GET /:id` - Get patient details
- `GET /:id/stats` - Patient statistics
- `POST /create-unclaimed` - Doctor creates unclaimed patient profile

#### Admin Routes (`/api/admin`) [Protected]
- **Registry Management**:
  - `GET /registry/overview` - System overview
  - `GET /registry/data` - Registry data export
  - `POST /registry/verify/:type/:id` - Verify entries
  - `GET /registry/topic/:topicId` - Topic details
  - `GET /registry/export` - Export data (rate limited)
  
- **User Management**:
  - `GET /users` - List all users
  - `POST /users` - Create user
  - `PUT /users/:userId` - Update user
  - `PUT /users/:userId/reset-password` - Reset password
  - `DELETE /users/:userId` - Delete user

- **System**:
  - `GET /anchors/failed` - Failed Hedera anchors
  - `POST /anchors/retry` - Retry failed anchors
  - `PUT /status/update` - Update system status
  - `GET /logs` - System logs
  - `GET /audit-log` - Audit trail
  - `POST /system/integrity-check` - Data integrity verification
  - `POST /hedera/sync` - Sync with Hedera

#### Appointment Routes (`/api/appointments`)
- `GET /specialties` - List medical specialties
- `GET /specialties/:specialtyId/doctors` - Doctors by specialty
- `GET /doctors/:doctorId/availability` - Doctor availability
- `GET /doctors/:doctorId/slots` - Available appointment slots
- `POST /` - Create appointment
- `GET /my-appointments` - User's appointments
- `PUT /:id/cancel` - Cancel appointment
- `PUT /:id/reschedule` - Reschedule appointment
- `GET /doctor/appointments` - Doctor's appointments
- `GET /doctor/today-patients` - Today's patients
- `PUT /:id/confirm` - Confirm appointment
- `PUT /:id/complete` - Complete appointment
- `GET /assistant/appointments` - Assistant's appointments
- `POST /assistant/create-on-behalf` - Create on behalf of patient

#### History Routes (`/api/history`)
- Doctor-patient interaction history
- Appointment history
- Access log history

#### Medication Traceability (`/api/medication`)
- `POST /deliver` - Record medication delivery
- `GET /trace/:matricule` - Trace medication through supply chain

#### Monitoring Routes (`/api/monitoring`)
- `GET /metrics` - System metrics
- `GET /health` - Health check
- `GET /alerts` - Active alerts
- `POST /reset` - Reset monitoring
- `GET /logs` - Monitoring logs

#### NFT Routes (`/api/nft`)
- NFT generation for verified records

### 2.2 Database Models & Relationships

**14 Core Models** using Sequelize ORM:

#### User Models
1. **BaseUser** - Base user class (parent)
   - id (UUID, PK)
   - email, password, firstName, lastName
   - role (patient, doctor, pharmacy, admin, assistant, radiologist)
   - isActive, isUnclaimed, patientIdentifier
   - createdByDoctorId (for unclaimed profiles)
   - timestamps

2. **Patient** - Patient-specific data
   - baseUserId (FK → BaseUser)
   - dateOfBirth, gender
   - emergencyContactName, emergencyContactPhone
   - socialSecurityNumber
   - Relationship: 1 BaseUser → 1 Patient

3. **Doctor** - Doctor profile
   - baseUserId (FK → BaseUser)
   - licenseNumber, specialty, hospital
   - Relationship: 1 BaseUser → 1 Doctor

4. **Pharmacy** - Pharmacy profile
   - baseUserId (FK → BaseUser)
   - licenseNumber, pharmacyName, pharmacyAddress
   - Relationship: 1 BaseUser → 1 Pharmacy

#### Medical Records Models
5. **MedicalRecord** - Patient medical records
   - id (UUID, PK)
   - patientId, doctorId (FKs → BaseUser)
   - type (consultation, prescription, test_result, vaccination, allergy)
   - title, description, diagnosis
   - prescription (JSON)
   - attachments, metadata (JSON)
   - **Hedera fields**: hash, hederaTransactionId, hederaSequenceNumber, hederaTopicId, hederaTimestamp
   - isVerified, lastVerifiedAt
   - **Prescription fields**: prescriptionMatricule (unique)
   - Hooks: Auto-generates prescription matricule for prescriptions
   - Relationships: M BaseUser → M MedicalRecord

6. **Prescription** - Individual prescriptions
   - id (UUID, PK)
   - patientId, doctorId, pharmacyId (FKs → BaseUser)
   - medicalRecordId (FK → MedicalRecord)
   - medication, dosage, instructions, quantity
   - issueDate, deliveryStatus (pending, delivered, cancelled)
   - matricule (unique, auto-generated PRX-YYYYMMDD-XXXX)
   - deliveryConfirmationHash
   - **Hedera fields**: hederaTransactionId, hederaSequenceNumber, hederaTopicId
   - isVerified, verifiedAt
   - Hooks: Auto-generates unique prescription matricule
   - Relationships: Many → Many (with delivery tracking)

7. **MedicalRecordAccess** - Access control
   - id (UUID, PK)
   - patientId, requesterId, reviewedBy (FKs → BaseUser)
   - status (pending, approved, rejected)
   - expiresAt (optional time-limited access)
   - reason, notes
   - Relationships: Controls visibility between doctors and patients

#### Appointment Models
8. **Appointment** - Medical appointments
   - id (UUID, PK)
   - patientId, doctorId, specialtyId (FKs)
   - emergencyApprovedBy, managedBy (FKs)
   - dateTime, duration, status
   - notes, emergencyReason
   - Relationships: Links patients, doctors, and specialties

9. **Specialty** - Medical specialties
   - id (UUID, PK)
   - name, description, code
   - Relationships: Many specialties → Many doctors

10. **DoctorSpecialty** - Doctor-specialty mapping
    - doctorId, specialtyId (FKs)
    - yearsOfExperience, isVerified
    - Relationships: M2M between doctors and specialties

11. **DoctorAvailability** - Doctor schedule
    - doctorId (FK)
    - dayOfWeek, startTime, endTime
    - maxPatientsPerDay, isAvailable
    - Relationships: 1 Doctor → Many availability slots

#### System Models
12. **HederaTransaction** - Blockchain transaction tracking
    - transactionId, topicId, sequenceNumber
    - recordType, recordId
    - status, hash
    - **Deprecated/Legacy**

13. **SystemStatus** - System health monitoring
    - status, hederaConnected, databaseStatus
    - lastUpdated, uptime metrics

14. **Additional Models**
    - Audit logs, Rate limit tracking

### 2.3 Core Services & Their Responsibilities

**22 Business Services** handling different domains:

#### Hedera Blockchain Services
1. **hederaService.js** (Primary)
   - `anchorPrescription()` - Hash-only anchoring with compression
   - `anchorMedicalRecord()` - Record anchoring
   - `anchorHashDirect()` - Direct hash anchoring with batching support
   - Features: Retry logic, batching, compression, rate limiting
   - Returns: Transaction ID, sequence number, topic ID

2. **batchAggregatorService.js**
   - Batches multiple records for efficient Hedera submission
   - `addToBatch()` - Queue records
   - `processBatch()` - Submit batch when size/timeout reached
   - Optimization: Reduce TPS costs, aggregate hashes

3. **rateLimiterService.js**
   - Per-user rate limiting for Hedera operations
   - `checkRateLimit()` - Enforce TPS limits
   - Strategy: Token bucket algorithm

4. **hashscanService.js**
   - HashScan blockchain explorer integration
   - `getTopicUrl()` - Generate explorer links
   - `getTopicMessageUrl()` - Message-specific links

5. **mirrorNodeService.js**
   - Hedera Mirror Node queries
   - `verifyHCSTransactionStatus()` - Verify anchoring
   - `getTopicDetails()`, `getTopicStats()`
   - Fallback: 2-minute simulation mode if Mirror Node unavailable

#### Medical Records & Access Services
6. **medicalRecordService.js**
   - CRUD operations for medical records
   - Access control enforcement
   - Record filtering by user role

7. **accessControlService.js**
   - `doctorHasAccessToPatient()` - Check access rights
   - `getAccessiblePatientsForDoctor()` - Patient list for doctor
   - Two-tier access: Created patients + approved requests

8. **patientService.js**
   - Patient profile management
   - Unclaimed patient creation (doctor creates on behalf)
   - Patient identifier generation and validation

9. **patientIdentifierService.js**
   - Patient identifier lifecycle (PAT-YYYYMMDD-XXXX format)
   - `generateIdentifier()` - UUID-based generation
   - `verifyIdentifier()` - Format validation

#### Security & Encryption
10. **encryptionService.js**
    - Data encryption at rest
    - `encrypt()`, `decrypt()` - Symmetric encryption

11. **securityService.js**
    - Password hashing, validation
    - Token management
    - Security policy enforcement

12. **securityMonitoringService.js**
    - Attack detection and logging
    - `logServerAction()` - Audit trail
    - Pattern recognition (brute force, etc.)

#### Utility Services
13. **hashService.js**
    - `generateDataHash()` - SHA-256 hashing
    - `verifyHashWithHCS()` - Verify against blockchain

14. **compressionService.js**
    - `compress()`, `decompress()` - Data compression for Hedera
    - Reduces on-chain storage costs

15. **matriculeService.js**
    - `formatMatriculeForUser()` - Display formatting
    - `validateAccess()` - Access control per role
    - `maskMatricule()` - Partial masking for security
    - `extractCreationDate()` - Date extraction

16. **matriculeGenerator.js**
    - `generatePrescription()` - PRX-YYYYMMDD-XXXX format
    - `generatePatient()` - PAT-YYYYMMDD-XXXX format
    - UUID-based (no race conditions)

#### Notification & Real-time Services
17. **statusUpdateService.js**
    - Hedera anchoring status updates
    - WebSocket broadcasting

18. **reminderService.js**
    - Appointment reminders

19. **monitoringService.js**
    - System health monitoring

#### NFT & Blockchain Services
20. **nftService.js**
    - NFT generation for verified records

21. **healthTokenService.js**
    - Health token economy (future feature)

22. **miscellaneous Services**
    - Request/response helpers
    - Validators and utilities

### 2.4 Hedera Blockchain Integration Details

#### Architecture
```
Medical Data → Hash Generation → Batching/Compression → Hedera HCS
    ↓                                                        ↓
Database (SQLite/PostgreSQL)              Hedera Testnet Topic
    ↓                                                        ↓
Local Query/Verification ← ← ← ← Mirror Node Query ← ← ← ← ← ←
```

#### Key Features
1. **Hash-Only Anchoring** (Privacy-Preserving)
   - Only SHA-256 hash stored on blockchain
   - Full medical data remains in secure database
   - Verification against blockchain hash

2. **Batching Optimization**
   - Multiple records → Single Hedera transaction
   - Configurable: Min size (10), Max size (50), Timeout (5 min)
   - Cost reduction: 50% transaction fees per record

3. **Compression**
   - Default: Enabled
   - Reduces message size for large records
   - Configurable threshold: 100 bytes

4. **Rate Limiting**
   - Per-user limit: 8 TPS (Hedera rate)
   - Token bucket algorithm
   - Prevents rate limit violations

5. **Retry Logic**
   - Automatic retries: 3 attempts
   - Exponential backoff: 2s, 4s, 8s
   - Failed anchors tracked for manual retry

6. **Multi-Topic Support**
   - PRESCRIPTION_DELIVERY: Drug delivery tracking
   - MEDICAL_RECORD: Medical records
   - ACCESS_LOG: Access control events
   - BATCH: Merkle tree batches
   - DEFAULT: Fallback topic (0.0.7070750)

#### Topics Configuration
```env
HEDERA_TOPIC_PRESCRIPTIONS=0.0.xxxx
HEDERA_TOPIC_RECORDS=0.0.xxxx
HEDERA_TOPIC_DELIVERIES=0.0.xxxx
HEDERA_TOPIC_ACCESS=0.0.xxxx
HEDERA_TOPIC_BATCH=0.0.xxxx
HEDERA_TOPIC_ID=0.0.xxxx (default)
```

#### Transaction Flow
```
1. Record Created
   ↓
2. Hash Generated (SHA-256 of record data)
   ↓
3. Check Batching Enabled?
   ├─ YES: Add to Batch Queue → Wait for trigger
   └─ NO: Direct Anchor
   ↓
4. Check Compression Needed?
   ├─ YES: Compress → Reduce size
   └─ NO: As-is
   ↓
5. Rate Limit Check (Per-User TPS)
   ↓
6. Submit to Hedera Topic
   ↓
7. Get Transaction ID + Sequence Number
   ↓
8. Save to Database (MedicalRecord/Prescription)
   ↓
9. Verify via Mirror Node (2-min simulation fallback)
   ↓
10. Mark as Verified → Broadcast WebSocket Update
```

### 2.5 Authentication & Authorization Flow

#### Authentication (JWT-based)
```
User Login (email, password)
    ↓
1. Validate email/password format
2. Hash password comparison (bcryptjs)
3. Validate user exists and is active
4. Check if patient is "unclaimed" → Reject
5. Generate JWT token:
   - Payload: {id, email, role}
   - Expiry: 7 days (configurable)
   - Secret: Environment variable (64+ chars)
6. Load user profile (Patient/Doctor/Pharmacy)
7. Return token + user data
    ↓
Store in localStorage (frontend)
Add to Authorization header: "Bearer {token}"
    ↓
On Each Request:
1. Extract token from Authorization header
2. Verify JWT signature
3. Check token expiry
4. Load user from database
5. Verify user is active
6. Attach to req.user
```

#### Authorization (Role-Based)
```
Protected Routes use middleware:
1. auth middleware: Verify JWT token
2. authorize(['role1', 'role2']): Check role

Roles:
- patient: Can view own records, request access to others' records
- doctor: Can create records, access approved patients, manage appointments
- pharmacy: Can fulfill prescriptions, view delivery status
- admin: Full system access, user management
- assistant: Appointment scheduling on behalf of doctors
- radiologist: View and annotate imaging records
```

#### Access Control Levels
```
1. Table-Level Access
   ├─ Patient: Own + approved access records
   ├─ Doctor: Created patients + approved requests
   └─ Admin: All records

2. Field-Level Access
   ├─ Sensitive fields (SSN): Doctor + patient only
   ├─ Metadata: Role-based filtering
   └─ Hedera TX details: Admin only

3. Time-Based Access
   ├─ Expiring access requests
   └─ Appointment windows
```

#### Unclaimed Patient Flow
```
Doctor creates patient without email:
├─ Generates PAT-YYYYMMDD-XXXX identifier
├─ Creates BaseUser with isUnclaimed=true
├─ No password set initially
├─ Patient receives identifier (printed/emailed)
    ↓
Patient Registration:
├─ POST /auth/link-patient-identifier
├─ Verify identifier format
├─ Find unclaimed patient
├─ Set email and password
├─ Update isUnclaimed=false
├─ Allow login
```

### 2.6 Key Features Implemented

#### 1. Medical Record Management
- **Types Supported**: Consultation, Prescription, Test Result, Vaccination, Allergy
- **Blockchain Anchoring**: Hash stored on Hedera HCS
- **Access Control**: Doctors request access, patients approve/deny
- **Metadata**: JSON fields for flexible data storage
- **Attachments**: Support for file references
- **Verification**: HashScan integration for public verification

#### 2. Prescription System with Matricules
- **Format**: PRX-YYYYMMDD-XXXX (20 chars)
- **Generation**: UUID-based (no race conditions)
- **Delivery Tracking**: Pharmacy confirmation
- **Status States**: Pending → Delivered → Completed
- **Expiration**: 30 days default
- **QR Code**: Optional QR code generation for easy sharing
- **Public Verification**: Verify prescription authenticity without login

#### 3. Hedera Blockchain Integration
- **Purpose**: Immutable audit trail for medical records
- **What's Stored**: Hash of record (SHA-256)
- **Privacy**: Full data in DB, hash on blockchain
- **Verification**: Mirror Node queries with fallback mode
- **Multi-Chain**: Supports dual EC25519/ECDSA accounts
- **Topics**: Separate topics for prescriptions, records, deliveries
- **Batching**: Optimize Hedera costs by batching records

#### 4. User Roles & Permissions
```
Role           Permissions
────────────────────────────────────────────────
Patient        - View own records
               - Request doctor access
               - Approve/deny access requests
               - View appointments
               - Track prescriptions

Doctor         - Create medical records
               - Create patient profiles
               - Request access to patient records
               - Schedule appointments
               - View patient history
               - Generate prescriptions

Pharmacy       - View prescriptions by matricule
               - Confirm delivery
               - Track medication supply
               - View delivery confirmations

Admin          - Manage users
               - View all records
               - System monitoring
               - Export data
               - Retry failed anchors

Assistant      - Schedule appointments on behalf
               - Search and manage patients
               - View appointment calls

Radiologist    - View imaging records
               - Add annotations
               - Generate reports
```

#### 5. Verification System
- **Levels**:
  1. **Local Verification**: Hash match in database
  2. **Blockchain Verification**: Mirror Node query
  3. **Timeline Verification**: Hedera timestamp proof
  4. **Tamper Detection**: Hash mismatch indicates tampering

- **Public Verification**: `/api/verify/prescription/:matricule`
  - No authentication required
  - Shows: Medication, status, blockchain confirmation
  - Prevents counterfeiting

- **Advanced Verification**:
  - `/api/verify/record/:id` - Full record verification
  - `/api/verify/hcs-status/:transactionId` - Transaction details
  - `/api/verify/topic-stats/:topicId` - Topic statistics

---

## 3. FRONTEND ANALYSIS

### 3.1 Component Structure

**16 Component Categories** organized by feature:

#### Authentication Components (`/components/auth`)
1. **LoginForm.jsx** - User login form
2. **RegisterForm.jsx** - User registration
3. **ProtectedRoute.jsx** - Role-based route guard
4. **PatientLinkForm.jsx** - Link patient to account
5. **PatientRecordGuard.jsx** - Patient record access guard

#### Medical Records Components (`/components/records`)
1. **RecordCard.jsx** - Record list item display
2. **RecordList.jsx** - Records collection view
3. **RecordForm.jsx** - Create/edit record form

#### Prescription Components (`/components/prescription`)
1. **MatriculeDisplay.jsx** - Prescription matricule display & sharing

#### Verification Components (`/components/verification`)
1. **HashScanVerification.jsx** - Blockchain verification UI
2. **IntegrityButton.jsx** - Verify record integrity

#### Doctor Components (`/components/doctor`)
- Doctor-specific dashboards and features

#### Patient Components (`/components/patient`)
1. **PatientMedicalRecordsView.jsx** - Patient medical records view

#### Pharmacy Components (`/components/pharmacy`)
- Pharmacy-specific features

#### Access Control Components (`/components/access`)
1. **AccessRequestModal.jsx** - Request patient data access
2. **DoctorRequestsModal.jsx** - View doctor requests

#### Appointment Components
- (In main pages, not separate components)

#### Notification Components (`/components/notifications`)
1. **NotificationCenter.jsx** - Centralized notifications
2. **RealtimeNotifications.jsx** - WebSocket-based updates
3. **NotificationBadge.jsx** - Badge counter

#### History Components (`/components/history`)
- Activity and change history viewing

#### Dashboard Components (`/components/dashboard`)
- Role-specific dashboards

#### Common Components (`/components/common`)
1. **Header.jsx** - Navigation header
2. **Footer.jsx** - Footer
3. **Alert.jsx** - Alert/toast notifications
4. **LoadingSpinner.jsx** - Loading indicator
5. **ErrorBoundary.jsx** - Error boundary for fault tolerance
6. **PatientIdentifierHelper.jsx** - Patient ID format help

#### Debug Components (`/components/debug`)
1. **WebSocketTester.jsx** - WebSocket connection testing

#### NFT Components (`/components/nft`)
- NFT generation and display

### 3.2 Main Pages & Views

**15 Main Pages**:

1. **Login.jsx** - Login form page
2. **Register.jsx** - Registration form page
3. **Dashboard.jsx** - Role-specific dashboard (home page)
4. **Records.jsx** - Medical records list
5. **RecordDetails.jsx** - Single record view
6. **CreateMedicalRecord.jsx** - New record creation
7. **PatientAppointments.jsx** - Patient's appointments
8. **DoctorAppointments.jsx** - Doctor's appointments
9. **HistoryView.jsx** - Activity history
10. **AdminRegistry.jsx** - Admin system registry
11. **AdminMonitoring.jsx** - Admin monitoring dashboard
12. **AdminSpecialtyManagement.jsx** - Manage medical specialties
13. **AdminUserManagement.jsx** - Manage users
14. **AssistantDashboard.jsx** - Legacy assistant dashboard
15. **AssistantDashboardV2.jsx** - New assistant dashboard

### 3.3 State Management Approach

#### Context API (for global state)
```javascript
AuthContext
├─ user: Current logged-in user
├─ token: JWT token
├─ loading: Auth initialization status
├─ login(): Authenticate user
├─ register(): Create new user
└─ logout(): Clear auth state
```

#### React Query (@tanstack/react-query)
- Caching HTTP requests
- Auto-refetching on focus
- Background updates
- Mutation management (create, update, delete)
- DevTools for debugging

#### Local Component State
- Form input state
- Modal/drawer visibility
- UI loading states
- Temporary UI states

### 3.4 API Integration

#### Main API Service (`services/api.js`)
```javascript
Axios Instance Configuration:
├─ baseURL: http://localhost:5000/api
├─ timeout: 30 seconds
├─ Request Interceptor:
│  └─ Add JWT token to all requests
├─ Response Interceptor:
│  ├─ Retry failed network requests (3x)
│  ├─ Handle 401 (token expired)
│  ├─ Queue requests during token refresh
│  └─ Redirect to login if token invalid
└─ Error Handling:
   ├─ Network errors → Retry with backoff
   ├─ Auth errors → Clear session
   └─ Server errors → User-friendly messages
```

#### Feature-Specific Services
- `authService.js` - Login, register, logout
- `medicalRecordService.js` - Record CRUD
- `recordService.js` - Record queries
- `accessService.js` - Access request management
- `appointmentService.js` - Appointment scheduling
- `adminService.js` - Admin operations
- `patienService.js` - Patient management
- `historyService.js` - Activity history
- `userService.js` - User operations
- `websocketService.js` - Real-time WebSocket

#### WebSocket Integration
```javascript
websocketService
├─ connect(token) - Establish connection
├─ disconnect() - Close connection
├─ on(event, callback) - Listen to events
├─ emit(event, data) - Send events
└─ isConnected() - Check status

Real-time Events:
├─ access-request-received
├─ access-request-updated
├─ record-created
├─ record-updated
├─ hedera-anchor-status
└─ system-notifications
```

### 3.5 Key UI Features

#### Authentication Flow (Frontend)
```
Login Page
  ↓ (enter credentials)
  ↓ POST /auth/login
  ↓ (receive token + user)
  ↓ Store token in localStorage
  ↓ Set user in AuthContext
  ↓ Redirect to Dashboard
```

#### Record Creation Flow
```
Doctor: Create Medical Record
  ├─ Form: Type, Title, Description, Diagnosis
  ├─ Optional: Prescription, Attachments, Metadata
  ├─ Submit → Backend
  ├─ Backend: Validate, Store in DB, Anchor to Hedera
  ├─ Frontend: Show loading spinner
  ├─ Broadcast: WebSocket update to patient
  └─ Display: Success message, Verification button

Patient: View Record
  ├─ If doctor created it for them: Visible immediately
  ├─ Otherwise: Listed as "pending access"
  ├─ Verify Button: Check blockchain integrity
  └─ Prescription: Download/share matricule
```

#### Access Request Flow
```
Doctor: Request Patient Access
  ├─ Find patient (search + select)
  ├─ Provide reason for access
  ├─ Submit access request
  └─ Status: Pending → Approved/Rejected

Patient: Approve/Deny
  ├─ Notification badge shows pending requests
  ├─ Review doctor details
  ├─ Review access reason
  ├─ Approve (set expiry): Grant access
  ├─ Deny: Reject request
  └─ Doctor: Gets notification, can now view records
```

---

## 4. KEY FEATURES IMPLEMENTATION

### 4.1 Medical Record Management

**Features**:
- Create, read, update, delete medical records
- Rich record types (consultation, prescription, test, vaccination, allergy)
- File attachments support
- Metadata customization
- Access control per patient
- Blockchain verification

**Implementation**:
- `MedicalRecord` model with flexible JSON fields
- `medicalRecordService` handles business logic
- `recordController` handles HTTP requests
- Automatic Hedera anchoring on creation
- WebSocket updates to interested parties

### 4.2 Prescription System with Matricules

**Matricule Format**: `PRX-YYYYMMDD-XXXX`
- 20 characters
- Date-based prefix enables sorting
- 8-char random suffix (UUID-based) prevents collisions
- Globally unique within system

**Lifecycle**:
```
Doctor: Issue Prescription
  ├─ Generate matricule (PRX-20251023-A1B2C3D4)
  ├─ Store in Prescription model
  ├─ Anchor hash to Hedera
  ├─ Generate QR code (optional)
  └─ Display/print for patient

Patient: Share with Pharmacy
  ├─ Show matricule (number or QR code)
  ├─ Or use public verification URL
  └─ Pharmacy verifies authenticity

Pharmacy: Fulfill Prescription
  ├─ Look up by matricule (public endpoint)
  ├─ Verify authenticity against blockchain
  ├─ Dispense medication
  ├─ Confirm delivery (POST /medication/deliver)
  ├─ Hash stored on Hedera
  └─ Patient gets notification
```

**Public Verification** (no login required):
```
GET /api/verify/prescription/:matricule
Response:
{
  prescription: {
    matricule: "PRX-20251023-A1B2",
    medication: "Amlodipine 5mg",
    status: "pending/delivered",
    issueDate: "2025-10-23"
  },
  hedera: {
    isAnchored: true,
    timestamp: "2025-10-23T10:00:00Z"
  },
  verification: {
    message: "Prescription authentique vérifiée sur blockchain"
  }
}
```

### 4.3 Hedera Blockchain Integration Details

**What Gets Anchored**:
- Not the full prescription/record
- Only the SHA-256 hash
- Metadata: record type, IDs, timestamp

**Why Hash-Only**:
- Privacy: Patient data stays secure in database
- Cost: Smaller payloads = lower Hedera fees
- Efficiency: Verify without storing 100MB on blockchain
- GDPR: Easier compliance (data not replicated)

**Verification Process**:
```
1. Frontend: Click "Verify" button
2. Backend: Query MedicalRecord (get hash)
3. Backend: Query Mirror Node for Hedera message
4. Backend: Compare stored hash with blockchain
5. Backend: Return verification status + timestamp
6. Frontend: Show "VERIFIED" badge with blockchain link
7. User: Can click link to see on HashScan explorer
```

**Optimization Features**:
- **Batching**: Multiple records → 1 Hedera TX (50% cost)
- **Compression**: GZIP compress data before hashing (reduce size)
- **Rate Limiting**: 8 TPS per user (respect Hedera limits)
- **Retry Logic**: Auto-retry failed anchors up to 3x
- **Fallback**: If Mirror Node unavailable, 2-minute simulation

### 4.4 User Roles & Permissions Matrix

| Feature | Patient | Doctor | Pharmacy | Admin | Assistant | Radiologist |
|---------|---------|--------|----------|-------|-----------|-------------|
| View own records | ✅ | - | - | ✅ | - | - |
| Create record | - | ✅ | - | ✅ | - | ✅ |
| Create patient | - | ✅ | - | ✅ | - | - |
| Request access | ✅ | ✅ | - | - | - | - |
| Approve access | ✅ | - | - | ✅ | - | - |
| Access approved records | - | ✅ | - | ✅ | - | ✅ |
| Fulfill prescription | - | - | ✅ | ✅ | - | - |
| Manage users | - | - | - | ✅ | - | - |
| System monitoring | - | - | - | ✅ | - | - |
| Schedule appointments | ✅ | ✅ | - | ✅ | ✅ | - |
| Verify records | ✅ | ✅ | ✅ | ✅ | - | ✅ |

### 4.5 Verification System Architecture

**Three Verification Levels**:

1. **Local Verification** (DB integrity)
   ```javascript
   const localHash = generateDataHash(recordData);
   const matches = localHash === record.hash;
   ```

2. **Blockchain Verification** (Hedera confirmation)
   ```javascript
   const mirrorResponse = queryHederaMirrorNode(record.hederaTopicId, record.hederaSequenceNumber);
   const blockchainHash = mirrorResponse.message.content;
   const isVerified = localHash === blockchainHash;
   ```

3. **Timeline Verification** (timestamp proof)
   ```javascript
   const hederaTimestamp = mirrorResponse.consensus_timestamp;
   const proof = {
     recordId: record.id,
     hash: hash,
     hederaTopicId: record.hederaTopicId,
     hederaSequenceNumber: record.hederaSequenceNumber,
     timestamp: hederaTimestamp,
     blockchain: 'Hedera Testnet'
   };
   ```

**Tamper Detection**:
- Hash mismatch indicates data modification
- Blockchain timestamp cannot be faked
- Audit trail in MedicalRecord.lastVerifiedAt

---

## 5. CONFIGURATION & DEPLOYMENT

### 5.1 Environment Variables Required

#### Backend Configuration
```env
# Server
NODE_ENV=development|production
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=<64+ character random string>
JWT_EXPIRE=7d

# Database
USE_POSTGRES=false|true
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# OR manual:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fadjma_db
DB_USER=postgres
DB_PASSWORD=password
DB_SSL=false|true

# Hedera Blockchain
HEDERA_NETWORK=testnet|mainnet
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b6570...
HEDERA_TOPIC_ID=0.0.xxxxx

# Hedera ECDSA (optional secondary account)
HEDERA_ECDSA_ACCOUNT_ID=0.0.xxxxx
HEDERA_ECDSA_PRIVATE_KEY=3030020100300706052b8104...
HEDERA_ECDSA_TOPIC_ID=0.0.xxxxx

# Multi-Topic Configuration
HEDERA_TOPIC_PRESCRIPTIONS=0.0.xxxx
HEDERA_TOPIC_RECORDS=0.0.xxxx
HEDERA_TOPIC_DELIVERIES=0.0.xxxx
HEDERA_TOPIC_ACCESS=0.0.xxxx
HEDERA_TOPIC_BATCH=0.0.xxxx

# Hedera Optimizations
HEDERA_USE_BATCHING=true
HEDERA_MAX_BATCH_SIZE=50
HEDERA_MIN_BATCH_SIZE=10
HEDERA_BATCH_TIMEOUT_MS=300000

HEDERA_USE_COMPRESSION=true
HEDERA_COMPRESSION_ENABLED=true
HEDERA_MIN_COMPRESSION_SIZE=100

HEDERA_MAX_TPS=8
HEDERA_RATE_LIMITER_ENABLED=true

# Verification Mode
USE_MIRROR_NODE=false|true

# KMS (Key Management Service)
KMS_PROVIDER=env|aws|gcp|vault

# AWS KMS (if KMS_PROVIDER=aws)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_KMS_KEY_ID=arn:aws:kms:region:account:key/id

# GCP KMS (if KMS_PROVIDER=gcp)
GCP_PROJECT_ID=project-id
GCP_LOCATION=us-central1
GCP_KEY_RING=keyring-name
GCP_CRYPTO_KEY=crypto-key-name
GCP_KEY_FILE=/path/to/service-account.json

# Vault (if KMS_PROVIDER=vault)
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=token
VAULT_SECRET_PATH=secret/data/hedera

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=password

# Logging
LOG_LEVEL=error|warn|info|debug
LOG_FILE=./logs/app.log

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
SESSION_SECRET=<32+ character secret>

# Monitoring (optional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
PROMETHEUS_PORT=9090

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app-password
EMAIL_FROM=noreply@fadjma.com
```

#### Frontend Configuration
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

### 5.2 Docker Setup

#### docker-compose.yml Services

**Backend Service**:
- Node.js 18 with Express
- Port: 5000
- Volumes: data, logs, uploads
- Health check: HTTP /health endpoint
- Depends on: PostgreSQL service

**PostgreSQL Database**:
- Version: 15-alpine
- Port: 5432
- Volumes: postgres-data
- Health check: pg_isready command
- Auto-creates database on startup

**Frontend Service**:
- Node.js with React build
- Nginx reverse proxy on port 3000
- Health check: wget to root path
- Depends on: Backend service

**Networks**:
- Single custom bridge network (fadjma-network)
- All services can communicate internally

**Volumes**:
- `backend-data`: Database and uploads
- `backend-logs`: Application logs
- `postgres-data`: PostgreSQL data persistence

#### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

### 5.3 Database Configuration

#### SQLite (Development)
```javascript
// Default, no setup needed
dialect: 'sqlite'
storage: './database.sqlite'
```

#### PostgreSQL (Production)
```javascript
// Manual configuration
dialect: 'postgres'
host: 'localhost'
port: 5432
database: 'fadjma_db'
username: 'postgres'
password: 'password'
SSL: true (for remote databases)
```

**Connection URL Format**:
```
postgresql://username:password@localhost:5432/dbname
```

**Hosting Providers Auto-Set**:
- Railway: `DATABASE_URL` provided
- Render: `DATABASE_URL` provided
- Heroku: `DATABASE_URL` provided
- Supabase: Full PostgreSQL URL provided

### 5.4 Dockerfile Details

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine

# Non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S fadjma -u 1001

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Source code
COPY src ./src
COPY server.js .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

USER fadjma
EXPOSE 5000
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

---

## 6. DEPLOYMENT RECOMMENDATIONS

### 6.1 Production Checklist

#### Infrastructure
- [ ] SSL/TLS certificates (Let's Encrypt)
- [ ] PostgreSQL configured with backups
- [ ] Redis cache for sessions (optional)
- [ ] CDN for static assets (Cloudflare)
- [ ] Monitoring (DataDog, New Relic)
- [ ] Log aggregation (ELK, Splunk)

#### Security
- [ ] JWT_SECRET: 64+ random characters
- [ ] Database password: Complex (16+ chars)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers (Helmet configured)
- [ ] Environment variables not in source control

#### Performance
- [ ] Enable Hedera batching
- [ ] Enable compression
- [ ] Redis caching
- [ ] Database indexes optimized
- [ ] Frontend code splitting (already configured)
- [ ] Nginx compression enabled

#### Monitoring
- [ ] Application logs rotation
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Alert rules configured
- [ ] Uptime monitoring

### 6.2 Deployment Platforms Supported

1. **Railway.app**
   - Zero-config PostgreSQL
   - Automatic scaling
   - Built-in monitoring

2. **Render.com**
   - Free PostgreSQL tier
   - Auto-deploy from Git
   - Health checks built-in

3. **Vercel** (Frontend)
   - Automatic deployments
   - Edge functions support
   - Analytics included

4. **AWS** (Full Stack)
   - RDS for PostgreSQL
   - ECS for containers
   - CloudFront CDN

5. **Docker Hub** (Self-hosted)
   - Build and push images
   - Deploy to any server
   - Full control

---

## 7. TESTING STRATEGY

### 7.1 Test Coverage

- **Unit Tests**: Services, utilities
- **Integration Tests**: API endpoints
- **Controller Tests**: Route handlers
- **Middleware Tests**: Auth, validation
- **E2E Tests**: Full user flows (optional)

### 7.2 Running Tests

```bash
# All tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:coverage

# Unit tests only
npm test:unit

# Integration tests
npm test:integration

# Controller tests
npm test:controllers

# Middleware tests
npm test:middleware
```

### 7.3 Test Configuration

- **Framework**: Jest 29.7
- **HTTP Testing**: Supertest 6.3
- **Configuration**: jest.config.js
- **Location**: tests/ directory

---

## 8. SECURITY BEST PRACTICES IMPLEMENTED

### 8.1 Authentication & Authorization
- JWT tokens with expiry (7 days default)
- Password hashing with bcryptjs (10 rounds)
- Role-based access control (6 roles)
- Token refresh capability
- Account deactivation support

### 8.2 Data Protection
- Hash-only blockchain anchoring (privacy)
- Optional field-level encryption
- SQL injection prevention (Sequelize ORM)
- XSS prevention (Express-validator)
- CSRF protection via SameSite cookies

### 8.3 API Security
- Helmet security headers
- CORS properly configured
- Rate limiting per endpoint
- Input validation on all routes
- Request logging and monitoring

### 8.4 Infrastructure
- Non-root Docker user
- SSL/TLS for production
- Environment variable secrets
- KMS support for key management
- Database SSL connections

### 8.5 Hedera Security
- Rate limiting on blockchain operations
- Automatic retry with backoff
- Transaction ID tracking
- Timestamp verification
- Compression to reduce data exposure

---

## 9. API DOCUMENTATION QUICK REFERENCE

### Common Endpoints

```bash
# Authentication
POST   /api/auth/register          # Create account
POST   /api/auth/login             # Login
GET    /api/auth/me                # Current user
POST   /api/auth/logout            # Logout

# Medical Records
GET    /api/records                # List (filtered)
POST   /api/records                # Create + Hedera anchor
GET    /api/records/:id            # Get details
PUT    /api/records/:id            # Update
DELETE /api/records/:id            # Delete
GET    /api/records/grouped-by-patient  # Grouped view
GET    /api/records/:id/prescriptions   # Get prescriptions

# Verification
GET    /api/verify/prescription/:matricule    # Public verify
GET    /api/verify/record/:id                 # Detailed verify
GET    /api/verify/hashscan-info              # Explorer links
GET    /api/verify/demo-links                 # Demo links

# Access Requests
POST   /api/access-requests        # Request access
GET    /api/access-requests        # List requests
PUT    /api/access-requests/:id    # Approve/deny
GET    /api/access-requests/patient/:patientId

# Patients
GET    /api/patients               # List all (admin)
GET    /api/patients/accessible-patients      # Doctor's patients
POST   /api/patients/create-unclaimed         # Create for patient

# Appointments
GET    /api/appointments/specialties          # List specialties
POST   /api/appointments           # Create appointment
GET    /api/appointments/my-appointments      # User's appointments

# Admin
GET    /api/admin/registry/overview           # System overview
GET    /api/admin/registry/export             # Export data
GET    /api/admin/users                       # Manage users
POST   /api/admin/anchors/retry               # Retry anchors
```

---

## 10. FUTURE ENHANCEMENTS

### Short Term (1-2 weeks)
- [ ] Automated backup system
- [ ] Email notifications
- [ ] SMS reminders for appointments
- [ ] Advanced search with filters
- [ ] Pagination optimization

### Medium Term (1-2 months)
- [ ] Mobile app (React Native)
- [ ] Video consultation integration
- [ ] ML-based diagnosis suggestions
- [ ] Multi-language support (currently French/English)
- [ ] Performance dashboards

### Long Term (3-6 months)
- [ ] Microservices architecture
- [ ] Event sourcing for audit trail
- [ ] AI/ML model integration
- [ ] International expansion (multiple countries)
- [ ] ISO 27001 certification
- [ ] HIPAA compliance

---

## CONCLUSION

FADJMA is a robust, production-ready healthcare platform that successfully integrates blockchain technology for medical record verification. The architecture separates concerns effectively, implements comprehensive security measures, and provides a user-friendly interface for multiple stakeholders.

**Key Strengths**:
- Innovative "enriched anchoring" approach (more data on blockchain than competitors)
- Flexible deployment (SQLite dev, PostgreSQL prod)
- Real-time updates via WebSocket
- Privacy-preserving hash-only anchoring
- Comprehensive access control system
- Extensive test coverage
- Docker-ready for easy deployment

**Ready for Production** with recommended security hardening and monitoring setup.

