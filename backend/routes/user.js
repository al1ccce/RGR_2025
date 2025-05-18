const express = require ('express')
const router = express.Router();
const authMiddleware = require('../middleware/auth')
const roleMiddleware = require('../middleware/admin')

const {getProf, updateProf, getDocs, getAllDocs, getAllUsers, getApplications, postApplication, solveApplication, getUserProf, ban, unban} = require('../controllers/user')

router.get('/me', authMiddleware, getProf);
router.put('/me', authMiddleware, updateProf);
router.get('/me/documents', authMiddleware, getDocs);
router.get('/documents', authMiddleware, getAllDocs);
router.get('/allusers', authMiddleware, roleMiddleware('admin'), getAllUsers);
router.get('/applications', authMiddleware, roleMiddleware('admin'), getApplications);
router.post('/applications', authMiddleware, postApplication);
router.put('/applications', authMiddleware, roleMiddleware('admin'), solveApplication);
router.get('/userr', authMiddleware, roleMiddleware('admin'), getUserProf);
router.post('/userr/ban', authMiddleware, roleMiddleware('admin'), ban);
router.post('/userr/unban', authMiddleware, roleMiddleware('admin'), unban);



module.exports = router;