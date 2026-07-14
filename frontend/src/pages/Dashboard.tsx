import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, type Task, type TaskStatus, type TaskPriority } from '../services/api';
import { 
  LogOut, Plus, CheckCircle2, Circle, Trash2, Edit2, 
  Calendar, Search, RefreshCw, ClipboardList, Play 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  // Editing State
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchQuery || undefined,
      };
      const fetchedTasks = await taskAPI.getTasks(filters);
      setTasks(fetchedTasks);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch tasks. Please ensure the database is running.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 300); // 300ms debounce for text search

    return () => clearTimeout(timer);
  }, [statusFilter, priorityFilter, searchQuery]);

  // Handle Create or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      setError(null);
      const taskData = {
        title,
        description: description || undefined,
        status,
        priority,
        due_date: dueDate || undefined,
      };

      if (editingTaskId !== null) {
        await taskAPI.updateTask(editingTaskId, taskData);
      } else {
        await taskAPI.createTask(taskData);
      }

      // Reset form
      resetForm();
      // Refetch tasks
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save task.');
    }
  };

  // Edit Task Loader
  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    // Format date from YYYY-MM-DDT... to YYYY-MM-DD
    if (task.due_date) {
      setDueDate(task.due_date.substring(0, 10));
    } else {
      setDueDate('');
    }
  };

  // Quick Status Toggle (Complete / Re-open)
  const handleQuickToggle = async (task: Task) => {
    try {
      const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
      await taskAPI.updateTask(task.id, { status: nextStatus });
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      setError('Failed to update task status.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setError(null);
      await taskAPI.deleteTask(id);
      fetchTasks();
      // If we are currently editing the deleted task, reset the form
      if (editingTaskId === id) {
        resetForm();
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete task.');
    }
  };

  // Reset Form helper
  const resetForm = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setStatus('pending');
    setPriority('medium');
    setDueDate('');
  };

  // Stats Calculator
  const totalCount = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const progressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-section">
          <h2>TaskSpace</h2>
        </div>
        <div className="user-section">
          <span className="user-name">Hello, {user?.username}</span>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="dashboard-content">
        {/* Left Side: Stats + Create Form */}
        <div className="dashboard-left">
          {/* Statistics summary */}
          <div className="glass-card panel-card">
            <h3 className="panel-title">
              <ClipboardList size={20} className="stat-total" />
              Task Statistics
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-val stat-total">{totalCount}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-item">
                <div className="stat-val stat-completed">{completedCount}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-val stat-progress">{progressCount}</div>
                <div className="stat-label">Running</div>
              </div>
              <div className="stat-item">
                <div className="stat-val stat-pending">{pendingCount}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          </div>

          {/* Create/Edit Form */}
          <div className="glass-card panel-card">
            <h3 className="panel-title">
              {editingTaskId ? (
                <>
                  <Edit2 size={20} style={{ color: 'var(--secondary)' }} />
                  Edit Task
                </>
              ) : (
                <>
                  <Plus size={20} style={{ color: 'var(--primary)' }} />
                  Create Task
                </>
              )}
            </h3>

            {error && (
              <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Update API docs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input textarea-input"
                  placeholder="Enter details of the task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="row-inputs">
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}
                  >
                    <option value="pending" style={{ background: 'var(--bg-secondary)' }}>Pending</option>
                    <option value="in_progress" style={{ background: 'var(--bg-secondary)' }}>In Progress</option>
                    <option value="completed" style={{ background: 'var(--bg-secondary)' }}>Completed</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}
                  >
                    <option value="low" style={{ background: 'var(--bg-secondary)' }}>Low</option>
                    <option value="medium" style={{ background: 'var(--bg-secondary)' }}>Medium</option>
                    <option value="high" style={{ background: 'var(--bg-secondary)' }}>High</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>
                  {editingTaskId ? 'Update Task' : 'Add Task'}
                </button>
                {editingTaskId && (
                  <button type="button" className="cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Tasks Search & Lists */}
        <div className="dashboard-right">
          {/* Filters Bar */}
          <div className="glass-card filter-bar">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                className="select-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)' }}>All Statuses</option>
                <option value="pending" style={{ background: 'var(--bg-secondary)' }}>Pending</option>
                <option value="in_progress" style={{ background: 'var(--bg-secondary)' }}>In Progress</option>
                <option value="completed" style={{ background: 'var(--bg-secondary)' }}>Completed</option>
              </select>

              <select
                className="select-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}
              >
                <option value="" style={{ background: 'var(--bg-secondary)' }}>All Priorities</option>
                <option value="low" style={{ background: 'var(--bg-secondary)' }}>Low</option>
                <option value="medium" style={{ background: 'var(--bg-secondary)' }}>Medium</option>
                <option value="high" style={{ background: 'var(--bg-secondary)' }}>High</option>
              </select>

              <button 
                className="icon-action-btn" 
                onClick={fetchTasks} 
                title="Refresh Tasks"
                style={{ border: '1px solid var(--border-color)', height: '40px', width: '40px', borderRadius: '8px' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Tasks Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 16px auto', animation: 'spin 1.5s linear infinite' }} />
              <p>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="no-tasks">
              <ClipboardList size={48} style={{ color: 'var(--text-muted)' }} />
              <div>
                <h4>No tasks found</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {searchQuery || statusFilter || priorityFilter 
                    ? 'Try adjusting your search criteria or filter fields.' 
                    : 'Start by creating your first task using the sidebar form!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="tasks-grid">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`glass-card task-card priority-${task.priority}`}
                >
                  <div>
                    <div className="task-card-header">
                      <h4 className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="task-actions">
                        <button 
                          className="icon-action-btn" 
                          onClick={() => handleQuickToggle(task)}
                          title={task.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 size={16} style={{ color: 'var(--status-completed)' }} />
                          ) : task.status === 'in_progress' ? (
                            <Play size={16} style={{ color: 'var(--status-in_progress)' }} />
                          ) : (
                            <Circle size={16} />
                          )}
                        </button>
                        <button 
                          className="icon-action-btn" 
                          onClick={() => handleEditClick(task)}
                          title="Edit Task"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="icon-action-btn delete" 
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="task-desc">{task.description || 'No description provided.'}</p>
                  </div>

                  <div className="task-card-footer">
                    <div className="badge-group">
                      <span className={`badge badge-status-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`badge badge-priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.due_date && (
                      <span className="task-due-date">
                        <Calendar size={12} />
                        {new Date(task.due_date).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Keyframe spin style */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
