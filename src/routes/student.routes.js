const express = require('express')
const studentController = require('../controllers/studentController')

const router = express.Router()

router.get('/list', (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de estudiante funcionando',
    data: []
  })
})
router.get('/scholarships', studentController.scholarships.bind(studentController))

router.get('/:studentId/dashboard', studentController.dashboard.bind(studentController))

router.get('/:studentId/profile', studentController.profile.bind(studentController))
router.put('/:studentId/profile', studentController.updateProfile.bind(studentController))

router.get('/:studentId/requests', studentController.requests.bind(studentController))
router.post('/:studentId/requests', studentController.createRequest.bind(studentController))

router.get('/:studentId/requests/:requestId', studentController.requestDetail.bind(studentController))
router.put('/:studentId/requests/:requestId', studentController.updateRequest.bind(studentController))
router.delete('/:studentId/requests/:requestId', studentController.deleteRequest.bind(studentController))

router.get('/:studentId/documents', studentController.documents.bind(studentController))
router.post('/:studentId/requests/:requestId/documents', studentController.addDocument.bind(studentController))

module.exports = router