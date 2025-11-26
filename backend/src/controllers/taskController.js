// const Task = require('../models/Task');

// exports.createTask = async (req, res) => {
//   try {
//     const t = await Task.create({ ...req.body, createdBy: req.user.id });
//     return res.status(201).json(t);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };



// exports.listTasks = async (req, res) => {
//   try {
//     // page & limit (pagination)
//     const page = Math.max(1, parseInt(req.query.page || '1', 10));
//     const limit = Math.min(100, parseInt(req.query.limit || '10', 10));
//     const skip = (page - 1) * limit;

//     // filters: status and q (search)
//     const { status, q } = req.query;
//     const filter = {};

//     if (status && status !== 'all') {
//       // ensure valid values only
//       if (['pending', 'completed'].includes(status)) {
//         filter.status = status;
//       }
//     }

//     if (q && q.trim().length > 0) {
//       // text search on title or description (case-insensitive)
//       const regex = new RegExp(q.trim(), 'i');
//       filter.$or = [{ title: regex }, { description: regex }];
//     }

//     const total = await Task.countDocuments(filter);
//     const tasks = await Task.find(filter)
//       .populate('createdBy', 'name email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     return res.json({ tasks, page, total, pages: Math.ceil(total / limit) });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };
// exports.getTask = async (req, res) => {
//   try {
//     const t = await Task.findById(req.params.id);
//     if (!t) return res.status(404).json({ message: 'Not found' });
//     return res.json(t);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.updateTask = async (req, res) => {
//   try {
//     const t = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     return res.json(t);
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.deleteTask = async (req, res) => {
//   try {
//     await Task.findByIdAndDelete(req.params.id);
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };


// backend/src/controllers/taskController.js
const mongoose = require('mongoose');
const Task = require('../models/Task');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const ALLOWED_STATUS = ['pending', 'completed'];
const ALLOWED_UPDATE_FIELDS = ['title', 'description', 'status'];

function pick(obj, keys = []) {
  const out = {};
  keys.forEach(k => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
}

exports.createTask = async (req, res) => {
  try {
    const { title, description = '', status = 'pending' } = req.body;

    if (!title || !title.toString().trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}` });
    }

    const createdBy = req.user && req.user.id;
    if (!createdBy) return res.status(401).json({ message: 'Unauthorized' });

    const task = await Task.create({
      title: title.toString().trim(),
      description: description.toString().trim(),
      status,
      createdBy,
    });

    // populate minimal creator info before returning
    await task.populate('createdBy', 'name email').execPopulate?.(); // mongoose v5/v6 compatibility
    const t = task.toObject ? task.toObject() : task;
    return res.status(201).json(t);
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listTasks = async (req, res) => {
  try {
    // pagination
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    // filters
    const { status, q } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      if (ALLOWED_STATUS.includes(status)) filter.status = status;
    }

    if (q && q.toString().trim()) {
      const regex = new RegExp(q.toString().trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    // non-admin users should only see their own tasks
    if (!req.user || req.user.role !== 'admin') {
      if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' });
      filter.createdBy = req.user.id;
    }

    const [total, tasks] = await Promise.all([
      Task.countDocuments(filter),
      Task.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const pages = Math.ceil(total / limit) || 1;
    return res.json({ tasks, page, total, pages });
  } catch (err) {
    console.error('listTasks error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid task id' });

    const task = await Task.findById(id).populate('createdBy', 'name email').lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // ownership check for non-admins
    if (req.user?.role !== 'admin' && String(task.createdBy?._id || task.createdBy) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(task);
  } catch (err) {
    console.error('getTask error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid task id' });

    // only allow known fields
    const payload = pick(req.body, ALLOWED_UPDATE_FIELDS);

    if (Object.prototype.hasOwnProperty.call(payload, 'status') && !ALLOWED_STATUS.includes(payload.status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}` });
    }

    // fetch task to verify ownership
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user?.role !== 'admin' && String(task.createdBy) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // apply updates
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        task[field] = payload[field];
      }
    });

    await task.save();
    await task.populate('createdBy', 'name email');

    return res.json(task);
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid task id' });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user?.role !== 'admin' && String(task.createdBy) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Task.deleteOne({ _id: id });
    return res.json({ ok: true });
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
