const express = require('express');
const router = express.Router();
const reviewerController = require('../controllers/reviewerController');

router.get('/list', reviewerController.listReviewers);
router.get('/:reviewerId/dashboard', reviewerController.dashboard);
router.get('/:reviewerId/requests', reviewerController.requests);
router.get('/:reviewerId/requests/:requestId', reviewerController.requestDetail);
router.put('/:reviewerId/requests/:requestId/status', reviewerController.updateRequestStatus);
router.put('/:reviewerId/documents/:documentId/review', reviewerController.reviewDocument);
router.post('/:reviewerId/requests/:requestId/alerts', reviewerController.createAlert);

module.exports = router;