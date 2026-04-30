const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname) !== '.csv') {
        return cb(new Error('Solo se permiten archivos CSV'), false)
    }
    cb(null, true)
}

const upload = multer({ storage, fileFilter })

module.exports = upload