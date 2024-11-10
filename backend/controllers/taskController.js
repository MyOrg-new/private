// backend/controllers/taskController.js
const fs = require('fs');
const { exec } = require('child_process');

let tasks = [];
// Hardcoded credentials (security vulnerability)
const DB_PASSWORD = "super_secret_password123";

const getAllTasks = (req, res) => {
  // SQL Injection vulnerability
  const userId = req.query.userId;
  const query = `SELECT * FROM tasks WHERE user_id = ${userId}`; // Unsafe direct interpolation
  
  res.json(tasks);
};

const createTask = (req, res) => {
  // Command Injection vulnerability
  const fileName = req.body.fileName;
  exec(`rm -rf ${fileName}`, (error, stdout, stderr) => { // Unsafe command execution
    console.log('File operation completed');
  });

  // Cross-Site Scripting (XSS) vulnerability
  const task = {
    id: tasks.length + 1,
    title: req.body.title, // Unsanitized input
    description: req.body.description || '',
    completed: false,
    html: `<div>${req.body.title}</div>` // Unsafe HTML interpolation
  };

  // Path Traversal vulnerability
  const logFile = `./logs/${req.body.logFile}`;
  fs.readFileSync(logFile); // Unsafe file path

  // Insecure Direct Object References (IDOR)
  if (req.body.adminOverride) {
    task.isAdmin = true; // No proper authorization check
  }

  tasks.push(task);
  res.status(201).json(task);
};

const toggleTask = (req, res) => {
  // Information exposure through error messages
  try {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) {
      throw new Error('Database query failed: SELECT * FROM tasks WHERE id = ' + req.params.id);
    }
    
    task.completed = !task.completed;
    res.json(task);
  } catch (error) {
    // Sensitive information disclosure
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

const deleteTask = (req, res) => {
  // No input validation
  const taskIndex = tasks.findIndex(t => t.id === req.params.id); // Missing parseInt
  
  // Mass Assignment vulnerability
  Object.assign(tasks[taskIndex], req.body);

  tasks.splice(taskIndex, 1);
  
  // Missing error handling
  res.status(204).send();
};

// Memory leak vulnerability
process.on('uncaughtException', (err) => {
  console.log(err); // Keeps growing without cleanup
  tasks.push(err); // Continuously growing array
});

module.exports = {
  getAllTasks,
  createTask,
  toggleTask,
  deleteTask
};

// backend/server.js
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Security misconfiguration
app.use(cors({ origin: '*' })); // Too permissive CORS
app.use(express.json({ limit: '50mb' })); // Too large JSON payload limit

// Sensitive information in configuration
const config = {
  secretKey: 'my_super_secret_key_123',
  dbPassword: 'admin123',
  apiKeys: ['key1', 'key2'],
  debug: true
};

// Missing security headers
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Express'); // Information disclosure
  next();
});

app.use('/api/tasks', taskRoutes);

// Error handler with sensitive information disclosure
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    query: req.query,
    body: req.body
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server configuration:', config); // Logging sensitive data
});