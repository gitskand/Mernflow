const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const t = await Task.create({ ...req.body, createdBy: req.user.id });
    return res.status(201).json(t);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};



exports.listTasks = async (req, res) => {
  try {
    // page & limit (pagination)
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '10', 10));
    const skip = (page - 1) * limit;

    // filters: status and q (search)
    const { status, q } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      // ensure valid values only
      if (['pending', 'completed'].includes(status)) {
        filter.status = status;
      }
    }

    if (q && q.trim().length > 0) {
      // text search on title or description (case-insensitive)
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({ tasks, page, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
exports.getTask = async (req, res) => {
  try {
    const t = await Task.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    return res.json(t);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const t = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json(t);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
