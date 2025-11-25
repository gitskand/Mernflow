const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/taskController');

router.get('/', auth, ctrl.listTasks);
router.post('/', auth, ctrl.createTask);
router.get('/:id', auth, ctrl.getTask);
router.put('/:id', auth, ctrl.updateTask);
router.delete('/:id', auth, role(['admin']), ctrl.deleteTask);

module.exports = router;
