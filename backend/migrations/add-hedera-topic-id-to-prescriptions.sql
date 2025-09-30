-- Migration to add hederaTopicId to Prescriptions table
ALTER TABLE Prescriptions
ADD COLUMN  VARCHAR(255) DEFAULT NULL;hederaTopicId