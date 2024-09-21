import React, { useReducer, useEffect, useState, useCallback } from 'react';
import './App.css';

// Define initial state
const initialState = {
  tasks: [],
  filter: 'All',
  searchQuery: '',
};

// Define reducer
function reducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
    case 'TOGGLE_COMPLETION':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload ? { ...task, completed: !task.completed } : task
        ),
      };
    case 'EDIT_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tasks, filter, searchQuery } = state;

  const [expandedTask, setExpandedTask] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: '',
  });
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState('');

  // Initialize tasks from localStorage
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    dispatch({ type: 'INITIALIZE', payload: savedTasks });
  }, []);

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Toggle dark mode
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Done' && task.completed) ||
      (filter !== 'Done' && task.priority === filter && !task.completed);
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle adding a new task with validation
  const addTask = useCallback(() => {
    const { title, description, dueDate, priority } = newTask;

    // Basic validation
    if (!title.trim() || !description.trim() || !dueDate || !priority) {
      setError('All fields are required.');
      return;
    }

    // Unique title validation
    const titleExists = tasks.some(task => task.title.toLowerCase() === title.toLowerCase());
    if (titleExists) {
      setError('Task title must be unique.');
      return;
    }

    // Due date validation
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) {
      setError('Due date cannot be in the past.');
      return;
    }

    const taskToAdd = {
      ...newTask,
      id: tasks.length ? Math.max(...tasks.map(task => task.id)) + 1 : 1,
      completed: false,
    };

    dispatch({ type: 'ADD_TASK', payload: taskToAdd });
    setNewTask({ title: '', description: '', dueDate: '', priority: '' });
    setIsAddingTask(false);
    setError('');
  }, [newTask, tasks]);

  // Handle editing a task with validation
  const saveEditedTask = useCallback(() => {
    const { title, description, dueDate, priority } = editingTask;

    // Basic validation
    if (!title.trim() || !description.trim() || !dueDate || !priority) {
      setError('All fields are required.');
      return;
    }

    // Unique title validation (exclude current task)
    const titleExists = tasks.some(
      task => task.title.toLowerCase() === title.toLowerCase() && task.id !== editingTask.id
    );
    if (titleExists) {
      setError('Task title must be unique.');
      return;
    }

    // Due date validation
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) {
      setError('Due date cannot be in the past.');
      return;
    }

    dispatch({ type: 'EDIT_TASK', payload: editingTask });
    setEditingTask(null);
    setError('');
  }, [editingTask, tasks]);

  // Toggle task expansion
  const toggleTaskExpansion = useCallback((id) => {
    setExpandedTask(expandedTask === id ? null : id);
  }, [expandedTask]);

  // Toggle task completion
  const toggleTaskCompletion = useCallback((id) => {
    dispatch({ type: 'TOGGLE_COMPLETION', payload: id });
  }, []);

  // Delete task
  const deleteTask = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch({ type: 'DELETE_TASK', payload: id });
    }
  }, []);

  // Start editing task
  const startEditingTask = useCallback((task) => {
    setEditingTask(task);
    setExpandedTask(task.id);
  }, []);

  // Handle search input
  const handleSearch = useCallback((e) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((priority) => {
    dispatch({ type: 'SET_FILTER', payload: priority });
  }, []);

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      <div className="container">
        <div className="header">
          <h1>Task Manager</h1>
          <button className="icon-button" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <button className="add-task-button" onClick={() => setIsAddingTask(true)}>
          + Add New Task
        </button>
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <div className="filter-buttons">
            {['All', 'High', 'Medium', 'Low', 'Done'].map(priority => (
              <button
                key={priority}
                className={`filter-button ${filter === priority ? 'active' : ''}`}
                onClick={() => handleFilterChange(priority)}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        {isAddingTask && (
          <div className="add-task-form">
            <h2>Add New Task</h2>
            <input
              type="text"
              placeholder="Task Name"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            />
            <div className="date-input">
              <span>📅</span>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
            <select
              value={newTask.priority}
              onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <option value="">Select Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className="form-buttons">
              <button onClick={addTask}>Add Task</button>
              <button onClick={() => { setIsAddingTask(false); setError(''); }}>Cancel</button>
            </div>
          </div>
        )}
        {filteredTasks.length ? (
          filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTask === task.id}
              toggleExpansion={toggleTaskExpansion}
              toggleCompletion={toggleTaskCompletion}
              startEditing={startEditingTask}
              deleteTask={deleteTask}
              setEditingTask={setEditingTask}
              setExpandedTask={setExpandedTask}
              setError={setError}
            />
          ))
        ) : (
          <p>No tasks found.</p>
        )}
        {editingTask && (
          <div className="edit-task-form">
            <h2>Edit Task</h2>
            <input
              type="text"
              value={editingTask.title}
              onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
            />
            <textarea
              value={editingTask.description}
              onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
            />
            <div className="date-input">
              <span>📅</span>
              <input
                type="date"
                value={editingTask.dueDate}
                onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
              />
            </div>
            <select
              value={editingTask.priority}
              onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className="form-buttons">
              <button onClick={saveEditedTask}>Save</button>
              <button onClick={() => { setEditingTask(null); setError(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoized TaskCard to prevent unnecessary re-renders
const TaskCard = React.memo(({ task, isExpanded, toggleExpansion, toggleCompletion, startEditing, deleteTask }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={`task-card ${task.completed ? 'completed-task' : ''}`}>
      <div className="task-header">
        <div className="task-title-date">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleCompletion(task.id)}
          />
          <h3 className={task.completed ? 'completed' : ''}>{task.title}</h3>
          <span className="due-date">Due: {formatDate(task.dueDate)}</span>
        </div>
        <div className="task-priority-expand">
          <span className={`priority ${task.priority.toLowerCase()}`}>
            {task.priority}
          </span>
          <button className="expand-button" onClick={() => toggleExpansion(task.id)}>
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="task-details">
          <p>{task.description}</p>
          <div className="task-actions">
            <button onClick={() => startEditing(task)}>Edit</button>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default App;
