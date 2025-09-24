const { validationResult } = require('express-validator');
const MedicalRecordAccessRequest = require('../models/MedicalRecordAccess');
const User = require('../models/User');
const { Op } = require('sequelize');

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

      // Prevent self-requests (unless admin)
      if (patientId === requesterId && req.user.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot request access to your own records'
        });
      }

      // Check if patient exists
      const patient = await User.findByPk(patientId);
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

      // Return the created request with requester info
      const requestWithInfo = await MedicalRecordAccessRequest.findByPk(accessRequest.id, {
        include: [
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role', 'licenseNumber']
          },
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Access request created successfully',
        data: requestWithInfo
      });

    } catch (error) {
      console.error('Create access request error:', error);
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

      const { rows: requests, count: total } = await MedicalRecordAccessRequest.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role', 'licenseNumber']
          },
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName', 'role'],
            required: false
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

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
      console.error('Get access requests error:', error);
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
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role', 'licenseNumber']
          },
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
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
      console.error('Get access request by ID error:', error);
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

      // Return updated request with includes
      const updatedRequest = await MedicalRecordAccessRequest.findByPk(id, {
        include: [
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role', 'licenseNumber']
          },
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'firstName', 'lastName', 'role'],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        message: `Access request ${status} successfully`,
        data: updatedRequest
      });

    } catch (error) {
      console.error('Update access request error:', error);
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
      console.error('Cancel access request error:', error);
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

      const { rows: requests, count: total } = await MedicalRecordAccessRequest.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'requester',
            attributes: ['id', 'firstName', 'lastName', 'role', 'licenseNumber']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

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
      console.error('Get requests for patient error:', error);
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

      const { rows: requests, count: total } = await MedicalRecordAccessRequest.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

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
      console.error('Get requests by requester error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new AccessController();