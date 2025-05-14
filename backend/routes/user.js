const express = require ('express')
const router = express.Router();
const authMiddleware = require('../middleware/auth')
const {getProf, updateProf, getDocs, getAllDocs, getAllUsers, getApplications, postApplication, solveApplication, getUserProf, ban} = require('../controllers/user')

router.get('/me', authMiddleware, getProf);
router.put('/me', authMiddleware, updateProf);
router.get('/me/documents', authMiddleware, getDocs);
router.get('/documents', authMiddleware, getAllDocs);
router.get('/allusers', authMiddleware, getAllUsers);
router.get('/applications', authMiddleware, getApplications);
router.post('/applications', authMiddleware, postApplication);
router.put('/applications', authMiddleware, solveApplication);
router.get('/userr', authMiddleware, getUserProf);
router.post('/userr', authMiddleware, ban);



module.exports = router;