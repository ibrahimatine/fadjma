# Patient Identifier System Implementation

## Overview

This implementation modifies the "Nouveau Dossier" button behavior to allow doctors to create patient profiles without login credentials. The system generates unique patient identifiers that patients can later use to create their accounts and access their medical records.

## Key Components

### 1. Database Changes (BaseUser Model)

**File:** `src/models/BaseUser.js`

- Made `email` and `password` nullable for unclaimed profiles
- Added new fields:
  - `patientIdentifier`: Unique identifier for unclaimed profiles
  - `isUnclaimed`: Boolean flag to track unclaimed status
  - `createdByDoctorId`: ID of doctor who created the profile
  - Additional patient fields for unclaimed profiles

### 2. Patient Identifier Service

**File:** `src/services/patientIdentifierService.js`

Core service handling:
- **Identifier Generation**: Format `PAT-YYYYMMDD-XXXX`
- **Uniqueness Validation**: Ensures no duplicate identifiers
- **Patient Creation**: Creates unclaimed patient profiles
- **Account Linking**: Links identifiers to user accounts
- **Data Management**: Retrieval and formatting functions

### 3. Security Service

**File:** `src/services/securityService.js`

Security measures including:
- **Rate Limiting**: Prevents abuse of identifier verification
- **Access Validation**: Ensures proper permissions
- **Activity Logging**: Audit trail for security events
- **Input Validation**: Validates identifier format and dates
- **Cleanup Functions**: Removes expired unclaimed profiles

### 4. Backend API Endpoints

**File:** `src/controllers/patientContoller.js`

New endpoints:
- `POST /api/patients/create-unclaimed`: Creates unclaimed patient profile
- `GET /api/patients/unclaimed/my`: Gets doctor's unclaimed patients
- `GET /api/auth/verify-patient-identifier/:identifier`: Verifies identifier
- `POST /api/auth/link-patient-identifier`: Links identifier to account

### 5. Frontend Components

#### Modified Dashboard Layout
**File:** `src/components/dashboard/DashboardLayout.jsx`
- Modified "Nouveau dossier" button to show dropdown
- Two options: "Créer un profil patient" and "Créer un dossier médical"

#### Patient Creation Modal
**File:** `src/components/patient/CreateUnclaimedPatientModal.jsx`
- Form for creating unclaimed patient profiles
- Displays generated identifier with copy/show/hide functionality
- Security features for identifier display

#### Patient Linking Form
**File:** `src/components/auth/PatientLinkForm.jsx`
- Two-step process: identifier verification → account creation
- Format validation and error handling
- Secure credential collection

## Security Features

### 1. Access Controls
- Only authenticated doctors can create unclaimed patients
- Unclaimed patients cannot authenticate until linked
- Rate limiting on identifier verification attempts
- IP-based tracking and logging

### 2. Data Protection
- Patient identifiers are generated securely
- Sensitive data is masked in logs
- Automatic cleanup of expired unclaimed profiles
- Validation of identifier dates and formats

### 3. Audit Trail
- All security events are logged
- Identifier generation, verification, and linking tracked
- Failed attempts and rate limit violations recorded

## Usage Flow

### Doctor Side
1. Doctor clicks "Nouveau dossier" → "Créer un profil patient"
2. Fills patient information (name, DOB, contact, etc.)
3. System generates unique identifier (e.g., `PAT-20241201-A7B9`)
4. Doctor receives identifier with sharing instructions
5. Doctor automatically gets access to patient's future records

### Patient Side
1. Patient receives identifier from doctor
2. Visits `/link-patient` page
3. Enters identifier → system verifies and shows patient info
4. Creates account credentials (email, password)
5. Account is linked, patient can now login normally

## API Endpoints

### Doctor Endpoints (Authenticated)
```
POST /api/patients/create-unclaimed
GET /api/patients/unclaimed/my
```

### Public Endpoints
```
GET /api/auth/verify-patient-identifier/:identifier
POST /api/auth/link-patient-identifier
```

## Configuration

### Environment Variables
- `JWT_SECRET`: For token signing
- `NODE_ENV`: Development/production mode

### Security Settings
- **Rate Limit**: 5 attempts per 15 minutes per IP/identifier
- **Identifier Expiry**: 1 year for cleanup
- **Format**: `PAT-YYYYMMDD-XXXX`

## Testing

Run the test script to validate functionality:
```bash
node test-patient-identifier-flow.js
```

Tests cover:
- Identifier generation and uniqueness
- Format validation
- Security validation
- Rate limiting
- Date extraction
- Event logging

## Security Considerations

1. **Identifier Security**
   - Identifiers are not predictable
   - Limited time validity
   - Rate limiting prevents brute force

2. **Data Privacy**
   - Unclaimed profiles have minimal data exposure
   - Audit logging for compliance
   - Automatic cleanup of unused profiles

3. **Access Control**
   - Doctor permissions validated
   - Automatic access grants are logged
   - Unclaimed patients cannot authenticate

## Future Enhancements

1. **QR Code Generation**: For easier identifier sharing
2. **SMS/Email Integration**: Automated identifier delivery
3. **Advanced Rate Limiting**: Redis-based distributed rate limiting
4. **Compliance Features**: GDPR/HIPAA specific logging and controls
5. **Mobile App Support**: Deep linking for patient registration

## Database Migration

When deploying to production, ensure the database is migrated to include the new BaseUser fields:
- `patientIdentifier`
- `isUnclaimed`
- `createdByDoctorId`
- Additional patient fields

## Monitoring

Monitor these metrics:
- Identifier generation rate
- Linking success rate
- Failed verification attempts
- Rate limit violations
- Cleanup operations

The system provides comprehensive logging for all operations to support monitoring and debugging.