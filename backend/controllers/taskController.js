let tasks = [];

const getAllTasks = (req, res) => {
  res.json(tasks);
};

const createTask = (req, res) => {
  const task = {
    id: tasks.length + 1,
    title: req.body.title,
    completed: false
  };
  tasks.push(task);
  res.status(201).json(task);
};

const toggleTask = (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).send('Task not found');
  
  task.completed = !task.completed;
  res.json(task);
};

const deleteTask = (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (taskIndex === -1) return res.status(404).send('Task not found');
  
  tasks.splice(taskIndex, 1);
  res.status(204).send();
};

module.exports = {
  getAllTasks,
  createTask,
  toggleTask,
  deleteTask
};
