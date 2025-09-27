const PatientIdentifierService = require('./src/services/patientIdentifierService');
const SecurityService = require('./src/services/securityService');

/**
 * Test script for Patient Identifier Flow
 * Run this to validate the basic functionality
 */
async function testPatientIdentifierFlow() {
  console.log('🧪 Testing Patient Identifier Flow...\n');

  try {
    // Test 1: Identifier Generation
    console.log('1. Testing identifier generation:');
    const identifier1 = await PatientIdentifierService.generateUniqueIdentifier();
    const identifier2 = await PatientIdentifierService.generateUniqueIdentifier();

    console.log(`   Generated: ${identifier1}`);
    console.log(`   Generated: ${identifier2}`);
    console.log(`   ✅ Identifiers are unique: ${identifier1 !== identifier2}`);

    // Test 2: Format Validation
    console.log('\n2. Testing identifier format validation:');
    const validFormats = [
      'PAT-20241201-A7B9',
      'PAT-20240315-12CD',
      'PAT-20241125-FF00'
    ];

    const invalidFormats = [
      'PAT-20241301-A7B9', // Invalid date
      'PAT-2024120-A7B9',  // Wrong date format
      'PT-20241201-A7B9',  // Wrong prefix
      'PAT-20241201-A7B',  // Wrong suffix length
      'invalid-format'      // Completely wrong
    ];

    validFormats.forEach(format => {
      const isValid = PatientIdentifierService.isValidFormat(format);
      console.log(`   ${format}: ${isValid ? '✅' : '❌'}`);
    });

    invalidFormats.forEach(format => {
      const isValid = PatientIdentifierService.isValidFormat(format);
      console.log(`   ${format}: ${isValid ? '❌ Should be invalid!' : '✅'}`);
    });

    // Test 3: Security Validation
    console.log('\n3. Testing security validation:');

    // Test with valid identifier
    const testValidation = SecurityService.validatePatientIdentifier(identifier1);
    console.log(`   Valid identifier check: ${testValidation.valid ? '✅' : '❌'}`);

    // Test with future date (should fail)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureIdentifier = `PAT-${futureDate.getFullYear()}${(futureDate.getMonth() + 1).toString().padStart(2, '0')}${futureDate.getDate().toString().padStart(2, '0')}-ABCD`;
    const futureValidation = SecurityService.validatePatientIdentifier(futureIdentifier);
    console.log(`   Future date identifier: ${futureValidation.valid ? '❌ Should be invalid!' : '✅'}`);

    // Test 4: Rate Limiting
    console.log('\n4. Testing rate limiting:');
    const testIp = '127.0.0.1';
    const testIdentifier = 'PAT-20241201-TEST';

    // Should allow first attempts
    for (let i = 1; i <= 5; i++) {
      const allowed = await SecurityService.checkRateLimit(testIdentifier, testIp);
      console.log(`   Attempt ${i}: ${allowed ? '✅ Allowed' : '❌ Blocked'}`);
    }

    // Should block 6th attempt
    const blocked = await SecurityService.checkRateLimit(testIdentifier, testIp);
    console.log(`   Attempt 6: ${blocked ? '❌ Should be blocked!' : '✅ Blocked as expected'}`);

    // Test 5: Date Extraction
    console.log('\n5. Testing date extraction:');
    const dateTestIdentifier = 'PAT-20241201-ABCD';
    const extractedDate = PatientIdentifierService.extractCreationDate(dateTestIdentifier);

    if (extractedDate) {
      console.log(`   Extracted date: ${extractedDate.toDateString()}`);
      console.log(`   ✅ Date extraction works`);
    } else {
      console.log(`   ❌ Date extraction failed`);
    }

    // Test 6: Security Event Logging
    console.log('\n6. Testing security event logging:');
    SecurityService.logSecurityEvent('TEST_EVENT', {
      testData: 'test',
      timestamp: new Date().toISOString()
    });
    console.log('   ✅ Security event logged (check logs)');

    console.log('\n🎉 All tests completed!\n');

    // Display example usage
    console.log('📋 Example Usage Flow:');
    console.log('1. Doctor creates unclaimed patient profile');
    console.log(`   - System generates identifier: ${identifier1}`);
    console.log('2. Doctor shares identifier with patient');
    console.log('3. Patient uses identifier to create account');
    console.log('4. System validates and links the account');
    console.log('5. Doctor gets automatic access to patient records\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPatientIdentifierFlow();
}

module.exports = { testPatientIdentifierFlow };