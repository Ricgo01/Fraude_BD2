const reviewerService = require('../services/reviewerService');

class ReviewerController {
  async listReviewers(req, res) {
    try {
      const data = await reviewerService.listReviewers();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error retrieving reviewers', error: error.message });
    }
  }

  async dashboard(req, res) {
    try {
      const data = await reviewerService.getDashboard(req.params.reviewerId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error retrieving dashboard', error: error.message });
    }
  }

  async requests(req, res) {
    try {
      const status = req.query.status || 'Pendiente';
      const data = await reviewerService.getRequests(req.params.reviewerId, status);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error retrieving requests', error: error.message });
    }
  }

  async requestDetail(req, res) {
    try {
      const data = await reviewerService.getRequestDetail(req.params.reviewerId, req.params.requestId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error retrieving request detail', error: error.message });
    }
  }

  async updateRequestStatus(req, res) {
    try {
      const data = await reviewerService.updateRequestStatus(req.params.reviewerId, req.params.requestId, req.body.status);
      res.json({ success: true, message: 'Request status updated successfully', data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error updating request status', error: error.message });
    }
  }

  async reviewDocument(req, res) {
    try {
      const data = await reviewerService.reviewDocument(req.params.reviewerId, req.params.documentId, req.body.status);
      res.json({ success: true, message: 'Document reviewed successfully', data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error reviewing document', error: error.message });
    }
  }

  async createAlert(req, res) {
    try {
      const data = await reviewerService.createAlert(req.params.reviewerId, req.params.requestId, req.body);
      res.status(201).json({ success: true, message: 'Alert created successfully', data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error creating alert', error: error.message });
    }
  }
}

module.exports = new ReviewerController();