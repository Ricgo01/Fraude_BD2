const studentService = require('../services/studentService')

class StudentController {
  async listStudents(req, res) {
    try {
      const data = await studentService.listStudents()

      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estudiantes',
        error: error.message
      })
    }
  }

  async dashboard(req, res) {
    try {
      const data = await studentService.getDashboard(req.params.studentId)

      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo dashboard del estudiante',
        error: error.message
      })
    }
  }

  async profile(req, res) {
    try {
      const data = await studentService.getProfile(req.params.studentId)

      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo perfil del estudiante',
        error: error.message
      })
    }
  }

  async updateProfile(req, res) {
    try {
      const data = await studentService.updateProfile(req.params.studentId, req.body)

      res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando perfil',
        error: error.message
      })
    }
  }

  async scholarships(req, res) {
    try {
      const data = await studentService.getScholarships()

      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo becas',
        error: error.message
      })
    }
  }

  async requests(req, res) {
    try {
      const data = await studentService.getRequests(req.params.studentId, req.query.estado)

      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo solicitudes',
        error: error.message
      })
    }
  }

  async requestDetail(req, res) {
    try {
      const data = await studentService.getRequestDetail(
        req.params.studentId,
        req.params.requestId
      )

      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo detalle de solicitud',
        error: error.message
      })
    }
  }

  async createRequest(req, res) {
    try {
      const data = await studentService.createRequest(req.params.studentId, req.body)

      res.status(201).json({
        success: true,
        message: 'Solicitud creada correctamente',
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creando solicitud',
        error: error.message
      })
    }
  }

  async updateRequest(req, res) {
    try {
      const data = await studentService.updateRequest(
        req.params.studentId,
        req.params.requestId,
        req.body
      )

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada o no editable'
        })
      }

      res.json({
        success: true,
        message: 'Solicitud actualizada correctamente',
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando solicitud',
        error: error.message
      })
    }
  }

  async deleteRequest(req, res) {
    try {
      const data = await studentService.deleteRequest(
        req.params.studentId,
        req.params.requestId
      )

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada o no eliminable'
        })
      }

      res.json({
        success: true,
        message: 'Solicitud eliminada correctamente',
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando solicitud',
        error: error.message
      })
    }
  }

  async documents(req, res) {
    try {
      const data = await studentService.getDocuments(
        req.params.studentId,
        req.query.estadoRevision
      )

      res.json({
        success: true,
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo documentos',
        error: error.message
      })
    }
  }

  async addDocument(req, res) {
    try {
      const data = await studentService.addDocument(
        req.params.studentId,
        req.params.requestId,
        req.body
      )

      res.status(201).json({
        success: true,
        message: 'Documento agregado correctamente',
        data
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error agregando documento',
        error: error.message
      })
    }
  }
}

module.exports = new StudentController()