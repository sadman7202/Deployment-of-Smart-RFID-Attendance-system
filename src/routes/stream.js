const express = require('express');

function createStreamRouter(attendanceService) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write('retry: 5000\n\n');

    const sendSnapshot = () => {
      const state = attendanceService.getState();
      res.write(`event: update\n`);
      res.write(`data: ${JSON.stringify(state)}\n\n`);
    };

    sendSnapshot();

    const unsubscribe = attendanceService.subscribe(() => {
      sendSnapshot();
    });

    const keepAlive = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
      res.end();
    });
  });

  return router;
}

module.exports = { createStreamRouter };