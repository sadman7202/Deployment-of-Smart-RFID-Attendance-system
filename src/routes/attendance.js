const express = require('express');

function createAttendanceRouter(attendanceService) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    await attendanceService.refreshFromSource();

    const filters = {
      name: req.query.name || '',
      date: req.query.date || '',
      uid: req.query.uid || '',
      search: req.query.search || '',
    };

    const records = attendanceService.getRecords(filters);
    const state = attendanceService.getState();

    res.json({
      total: records.length,
      allRecords: state.total,
      lastUpdatedAt: state.lastUpdatedAt,
      error: state.error,
      records,
    });
  });

  return router;
}

module.exports = { createAttendanceRouter };