-- Migration to add hederaTopicId to Prescriptions table
ALTER TABLE Prescriptions
ADD COLUMN hederaTopicId VARCHAR(255) DEFAULT NULL;