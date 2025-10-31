const { validationResult } = require('express-validator');
const MedicalRecordAccessRequest = require('../models/MedicalRecordAccess');
const { BaseUser } = require('../models');
const { Op } = require('sequelize');
const hederaService = require('../services/hederaService');
const monitoringService = require('../services/monitoringService');
const logger = require('../utils/logger');

class AccessController {

  // Create new access request
  async createAccessRequest(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { patientId, reason, accessLevel = 'read', expiresAt } = req.body;
      const requesterId = req.user.id;

      logger.info('New access request', { requesterId, patientId, reason, accessLevel });

      // Prevent self-requests (unless admin)
      if (patientId === requesterId && req.user.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot request access to your own records'
        });
      }

      // Check if patient exists
      const patient = await BaseUser.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      if (patient.role !== 'patient') {
        return res.status(400).json({
          success: false,
          message: 'Can only request access to patient records'
        });
      }

      // Check if similar request already exists and is pending
      const existingRequest = await MedicalRecordAccessRequest.findOne({
        where: {
          patientId,
          requesterId,
          status: 'pending'
        }
      });

      if (existingRequest) {
        return res.status(409).json({
          success: false,
          message: 'A pending request already exists for this patient'
        });
      }

      // Create access request
      const accessRequest = await MedicalRecordAccessRequest.create({
        patientId,
        requesterId,
        reason,
        accessLevel,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      });

      // Ancrer la demande d'autorisation sur Hedera pour compliance RGPD
      try {
        console.log(`🔗 Ancrage demande d'accès ${accessRequest.id} sur Hedera...`);
        const hederaResult = await hederaService.anchorRecord({
          id: accessRequest.id,
          type: 'access_request',
          patientId: accessRequest.patientId,
          requesterId: accessRequest.requesterId,
          reason: accessRequest.reason,
          accessLevel: accessRequest.accessLevel,
          status: 'pending',
          createdAt: accessRequest.createdAt
        });

        // Sauvegarder les infos Hedera
        await accessRequest.update({
          hederaTransactionId: hederaResult.topicId,
          hederaSequenceNumber: hederaResult.sequenceNumber,
          hederaTimestamp: new Date()
        });

        console.log(`✅ Demande d'accès ${accessRequest.id} ancrée avec succès`);
      } catch (hederaError) {
        console.error(`❌ Échec ancrage demande d'accès ${accessRequest.id}:`, hederaError);
        // Continuer sans Hedera pour ne pas bloquer l'utilisateur
      }

      // Return the created request with requester info
      const requestWithInfo = await MedicalRecordAccessRequest.findByPk(accessRequest.id, {
        include: [
          {
            model: BaseUser,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role']
          },
          {
            model: BaseUser,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      // Send immediate WebSocket notification to the patient
      if (req.io && requestWithInfo) {
        // Use the new specialized notification function
        req.io.notifyNewAccessRequest({
          id: requestWithInfo.id,
          doctorId: requestWithInfo.requesterId,
          doctorName: `${requestWithInfo.requester.firstName} ${requestWithInfo.requester.lastName}`,
          patientId: requestWithInfo.patientId,
          accessLevel: requestWithInfo.accessLevel,
          reason: requestWithInfo.reason
        });

        console.log(`🔔 WebSocket notification sent for new access request: ${requestWithInfo.id} to patient: ${patientId}`);
      }

      res.status(201).json({
        success: true,
        message: 'Access request created successfully',
        data: requestWithInfo
      });

    } catch (error) {
      logger.error('Error creating access request', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get access requests with filters
  async getAccessRequests(req, res) {
    try {
      const {
        status,
        patientId,
        requesterId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const where = {};

      // Apply filters
      if (status) where.status = status;
      if (patientId) where.patientId = patientId;
      if (requesterId) where.requesterId = requesterId;

      // Role-based filtering
      if (req.user.role === 'patient') {
        // Patients can only see requests for their own records
        where.patientId = req.user.id;
      } else if (req.user.role === 'doctor') {
        // Doctors can see their own requests
        where.requesterId = req.user.id;
      }
      // Admins can see all requests

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let requests, total;
      try {
        const result = await MedicalRecordAccessRequest.findAndCountAll({
          where,
          include: [
            {
              model: BaseUser,
              as: 'requester',
              attributes: ['id', 'firstName', 'lastName', 'role']
            },
            {
              model: BaseUser,
              as: 'patient',
              attributes: ['id', 'firstName', 'lastName']
            },
            {
              model: BaseUser,
              as: 'reviewer',
              attributes: ['id', 'firstName', 'lastName', 'role'],
              required: false
            }
          ],
          order: [[sortBy, sortOrder.toUpperCase()]],
          limit: parseInt(limit),
          offset
          });
          requests = result.rows;
          total = result.count;
        } catch (dbError) {
          logger.error('Database query error in getAccessRequests', { error: dbError.message });
          return res.status(500).json({
            success: false,
            message: 'Database query failed',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
          });
        }

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Error in getAccessRequests', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get specific access request by ID
  async getAccessRequestById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      const request = await MedicalRecordAccessRequest.findByPk(id, {
        include: [
          {
            model: BaseUser,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role']
          },
          {
            model: BaseUser,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: BaseUser,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName', 'role'],
            required: false
          }
        ]
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Access request not found'
        });
      }

      // Check authorization
      const canView = req.user.role === 'admin' ||
                     request.patientId === req.user.id ||
                     request.requesterId === req.user.id;

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this request'
        });
      }

      res.json({
        success: true,
        data: request
      });

    } catch (error) {
      logger.error('Error getting access request by ID', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update access request (approve/reject)
  async updateAccessRequest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      const request = await MedicalRecordAccessRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Access request not found'
        });
      }

      // Check authorization - only patient or admin can approve/reject
      const canUpdate = req.user.role === 'admin' || request.patientId === req.user.id;
      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this request'
        });
      }

      // Can only update pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only update pending requests'
        });
      }

      // Update the request
      await request.update({
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewNotes
      });

      // Ancrer la décision d'autorisation sur Hedera (compliance RGPD)
      try {
        console.log(`🔗 Ancrage décision d'accès ${request.id} (${status}) sur Hedera...`);
        const hederaResult = await hederaService.anchorRecord({
          id: `${request.id}_decision`,
          type: 'access_decision',
          originalRequestId: request.id,
          patientId: request.patientId,
          requesterId: request.requesterId,
          reviewerId: req.user.id,
          decision: status,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null
        });

        console.log(`✅ Décision d'accès ${request.id} (${status}) ancrée avec succès`);

        // Enregistrer dans le monitoring
        monitoringService.recordSystemRequest('/api/access-requests', 'PUT', 200, Date.now() - Date.now());
      } catch (hederaError) {
        console.error(`❌ Échec ancrage décision d'accès ${request.id}:`, hederaError);
        // Continuer sans Hedera pour ne pas bloquer l'utilisateur
      }

      // Return updated request with includes
      const updatedRequest = await MedicalRecordAccessRequest.findByPk(id, {
        include: [
          {
            model: BaseUser,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role']
          },
          {
            model: BaseUser,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: BaseUser,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName', 'role'],
            required: false
          }
        ]
      });

      // Send immediate WebSocket notification to the requester using the new specialized function
      if (req.io && updatedRequest) {
        req.io.notifyAccessRequestUpdate(
          updatedRequest.id,
          status,
          updatedRequest.patientId,
          updatedRequest.requesterId
        );

        console.log(`🔔 WebSocket notification sent for ${status} access request: ${updatedRequest.id} to requester: ${updatedRequest.requesterId}`);
      }

      res.json({
        success: true,
        message: `Access request ${status} successfully`,
        data: updatedRequest
      });

    } catch (error) {
      logger.error('Error updating access request', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Cancel access request
  async cancelAccessRequest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      const request = await MedicalRecordAccessRequest.findByPk(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Access request not found'
        });
      }

      // Only requester or admin can cancel
      const canCancel = req.user.role === 'admin' || request.requesterId === req.user.id;
      if (!canCancel) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this request'
        });
      }

      // Can only cancel pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel pending requests'
        });
      }

      await request.destroy();

      res.json({
        success: true,
        message: 'Access request cancelled successfully'
      });

    } catch (error) {
      logger.error('Error cancelling access request', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get requests for specific patient
  async getRequestsForPatient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { patientId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      // Check authorization
      const canView = req.user.role === 'admin' || req.user.id === patientId;
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view requests for this patient'
        });
      }

      const where = { patientId };
      if (status) where.status = status;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let requests, total;
      try {
        const result = await MedicalRecordAccessRequest.findAndCountAll({
          where,
          include: [
            {
              model: BaseUser,
              as: 'requester',
              attributes: ['id', 'firstName', 'lastName', 'role']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit),
          offset
        });
        requests = result.rows;
        total = result.count;
      } catch (dbError) {
        logger.error('Database query error in getRequestsForPatient', { error: dbError.message });
        return res.status(500).json({
          success: false,
          message: 'Database query failed',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Error in getRequestsForPatient', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get requests by specific requester
  async getRequestsByRequester(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { requesterId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      // Check authorization
      const canView = req.user.role === 'admin' || req.user.id === requesterId;
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view requests from this requester'
        });
      }

      const where = { requesterId };
      if (status) where.status = status;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let requests, total;
      try {
        const result = await MedicalRecordAccessRequest.findAndCountAll({
          where,
          include: [
            {
              model: BaseUser,
              as: 'patient',
              attributes: ['id', 'firstName', 'lastName']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit),
          offset
        });
        requests = result.rows;
        total = result.count;
      } catch (dbError) {
        logger.error('Database query error in getRequestsByRequester', { error: dbError.message });
        return res.status(500).json({
          success: false,
          message: 'Database query failed',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Error in getRequestsByRequester', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Check if a requester has active access to a patient's records
  async checkMedicalRecordAccess(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { patientId } = req.params;
      const requesterId = req.user.id;

      // Find an active, approved access request
      const activeAccess = await MedicalRecordAccessRequest.findOne({
        where: {
          patientId,
          requesterId,
          status: 'approved',
          [Op.or]: [
            { expiresAt: { [Op.gte]: new Date() } }, // Not expired
            { expiresAt: null } // No expiration
          ]
        }
      });

      if (!activeAccess) {
        return res.status(404).json({
          success: false,
          message: 'No active access found for this patient'
        });
      }

      res.json({
        success: true,
        message: 'Active access found',
        data: {
          accessLevel: activeAccess.accessLevel,
          expiresAt: activeAccess.expiresAt
        }
      });

    } catch (error) {
      logger.error('Error checking medical record access', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AccessController();