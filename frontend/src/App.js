import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Auth context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      await axios.post(`${API}/auth/register`, { email, password });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Components
const LoginForm = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login to Lab Journal</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onToggle}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Register here
          </button>
        </p>

      </div>
    </div>
  );
};

const RegisterForm = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const result = await register(email, password);
    if (result.success) {
      setSuccess('Registration successful! You can now login. Note: You will have guest permissions until an admin upgrades your account.');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register for Lab Journal</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onToggle}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome, {user?.email}</h2>
        <p className="text-gray-600">Role: <span className="font-medium capitalize">{user?.role}</span></p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-800">Total Chemicals</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total_chemicals}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-purple-800">Total Experiments</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.total_experiments}</p>
          </div>

          <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-red-800">Low Stock</h3>
            <p className="text-3xl font-bold text-red-600">{stats.low_stock_count}</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-yellow-800">Expiring Soon</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.expiring_soon_count}</p>
          </div>
        </div>
      )}

      {stats?.user_recent_experiments?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Your Recent Experiments</h3>
          <div className="space-y-3">
            {stats.user_recent_experiments.map((experiment) => (
              <div key={experiment.id} className="flex justify-between items-center p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                <div>
                  <span className="font-medium">{experiment.title}</span>
                  <span className="text-sm text-gray-600 ml-2">({new Date(experiment.date).toLocaleDateString()})</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    experiment.results ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {experiment.results ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.low_stock_chemicals?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Low Stock Alerts</h3>
          <div className="space-y-2">
            {stats.low_stock_chemicals.map((chemical) => (
              <div key={chemical.id} className="flex justify-between items-center p-3 bg-red-50 rounded border-l-4 border-red-400">
                <div>
                  <span className="font-medium">{chemical.name}</span>
                  <span className="text-sm text-gray-600 ml-2">({chemical.location})</span>
                </div>
                <div className="text-right">
                  <span className="text-red-600 font-medium">{chemical.quantity} {chemical.unit}</span>
                  <div className="text-xs text-gray-500">Threshold: {chemical.low_stock_threshold} {chemical.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ExperimentJournal = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState(null);
  const [viewingExperiment, setViewingExperiment] = useState(null);

  useEffect(() => {
    fetchExperiments();
  }, [searchTerm, dateFrom, dateTo]);

  const fetchExperiments = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (dateFrom) params.date_from = new Date(dateFrom).toISOString();
      if (dateTo) params.date_to = new Date(dateTo).toISOString();
      
      const response = await axios.get(`${API}/experiments`, { params });
      setExperiments(response.data);
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExperiment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this experiment?')) return;
    
    try {
      await axios.delete(`${API}/experiments/${id}`);
      fetchExperiments();
    } catch (error) {
      console.error('Failed to delete experiment:', error);
      alert(error.response?.data?.detail || 'Failed to delete experiment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Experiment Journal</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Add Experiment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search experiments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((experiment) => (
            <div key={experiment.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow border-l-4 border-purple-400">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{experiment.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(experiment.date).toLocaleDateString()}
                </span>
              </div>
              
              {experiment.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{experiment.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-2">
                {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {experiment.chemicals_used.length} chemical(s)
                  </span>
                )}
                {experiment.equipment_used && experiment.equipment_used.length > 0 && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    {experiment.equipment_used.length} equipment
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingExperiment(experiment)}
                    className="text-purple-600 hover:text-purple-900 text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setEditingExperiment(experiment)}
                    className="text-green-600 hover:text-green-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteExperiment(experiment.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
                
                <span className={`text-xs px-2 py-1 rounded ${
                  experiment.results ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {experiment.results ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {experiments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No experiments found. Add your first experiment to get started!
          </div>
        )}
      </div>

      {(showAddForm || editingExperiment) && (
        <ExperimentForm
          experiment={editingExperiment}
          onClose={() => {
            setShowAddForm(false);
            setEditingExperiment(null);
          }}
          onSave={() => {
            fetchExperiments();
            setShowAddForm(false);
            setEditingExperiment(null);
          }}
        />
      )}

      {viewingExperiment && (
        <ExperimentDetails
          experiment={viewingExperiment}
          onClose={() => setViewingExperiment(null)}
          onEdit={() => {
            setEditingExperiment(viewingExperiment);
            setViewingExperiment(null);
          }}
        />
      )}
    </div>
  );
};

const ExperimentForm = ({ experiment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: experiment?.title || '',
    date: experiment?.date ? experiment.date.split('T')[0] : new Date().toISOString().split('T')[0],
    description: experiment?.description || '',
    procedure: experiment?.procedure || '',
    chemicals_used: experiment?.chemicals_used || [],
    equipment_used: experiment?.equipment_used || [],
    observations: experiment?.observations || '',
    results: experiment?.results || '',
    conclusions: experiment?.conclusions || '',
    external_links: experiment?.external_links || []
  });
  
  const [availableChemicals, setAvailableChemicals] = useState([]);
  const [selectedChemical, setSelectedChemical] = useState('');
  const [chemicalQuantity, setChemicalQuantity] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newLink, setNewLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableChemicals();
  }, []);

  const fetchAvailableChemicals = async () => {
    try {
      const response = await axios.get(`${API}/experiments/chemicals/available`);
      setAvailableChemicals(response.data);
    } catch (error) {
      console.error('Failed to fetch chemicals:', error);
    }
  };

  const addChemical = () => {
    if (!selectedChemical || !chemicalQuantity) return;
    
    const chemical = availableChemicals.find(c => c.id === selectedChemical);
    if (!chemical) return;

    const newChemical = {
      chemical_id: chemical.id,
      chemical_name: chemical.name,
      quantity_used: parseFloat(chemicalQuantity),
      unit: chemical.unit,
      available_quantity: chemical.quantity
    };

    setFormData({
      ...formData,
      chemicals_used: [...formData.chemicals_used, newChemical]
    });

    setSelectedChemical('');
    setChemicalQuantity('');
  };

  const removeChemical = (index) => {
    const updatedChemicals = formData.chemicals_used.filter((_, i) => i !== index);
    setFormData({ ...formData, chemicals_used: updatedChemicals });
  };

  const addEquipment = () => {
    if (!newEquipment.trim()) return;
    
    setFormData({
      ...formData,
      equipment_used: [...formData.equipment_used, newEquipment.trim()]
    });
    setNewEquipment('');
  };

  const removeEquipment = (index) => {
    const updatedEquipment = formData.equipment_used.filter((_, i) => i !== index);
    setFormData({ ...formData, equipment_used: updatedEquipment });
  };

  const addLink = () => {
    if (!newLink.trim()) return;
    
    setFormData({
      ...formData,
      external_links: [...formData.external_links, newLink.trim()]
    });
    setNewLink('');
  };

  const removeLink = (index) => {
    const updatedLinks = formData.external_links.filter((_, i) => i !== index);
    setFormData({ ...formData, external_links: updatedLinks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };

      if (experiment) {
        await axios.put(`${API}/experiments/${experiment.id}`, data);
      } else {
        await axios.post(`${API}/experiments`, data);
      }
      
      onSave();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save experiment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {experiment ? 'Edit Experiment' : 'Add Experiment'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              placeholder="Brief description of the experiment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
            <textarea
              value={formData.procedure}
              onChange={(e) => setFormData({...formData, procedure: e.target.value})}
              rows="4"
              placeholder="Describe the experimental procedure step by step..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chemicals Used</label>
            <div className="flex space-x-2 mb-2">
              <select
                value={selectedChemical}
                onChange={(e) => setSelectedChemical(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a chemical from inventory</option>
                {availableChemicals.map((chemical) => (
                  <option key={chemical.id} value={chemical.id}>
                    {chemical.name} (Available: {chemical.quantity} {chemical.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                value={chemicalQuantity}
                onChange={(e) => setChemicalQuantity(e.target.value)}
                placeholder="Quantity used"
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={addChemical}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add
              </button>
            </div>
            
            {formData.chemicals_used.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-700">Added Chemicals:</h4>
                {formData.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span>
                      <strong>{chemical.chemical_name}</strong> - {chemical.quantity_used} {chemical.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChemical(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Used</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Enter equipment name (e.g., Bunsen burner, microscope, etc.)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={addEquipment}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add
              </button>
            </div>
            
            {formData.equipment_used.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-700">Added Equipment:</h4>
                {formData.equipment_used.map((equipment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span>{equipment}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
                rows="4"
                placeholder="Record your observations during the experiment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
              <textarea
                value={formData.results}
                onChange={(e) => setFormData({...formData, results: e.target.value})}
                rows="4"
                placeholder="Document your experimental results..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conclusions</label>
              <textarea
                value={formData.conclusions}
                onChange={(e) => setFormData({...formData, conclusions: e.target.value})}
                rows="4"
                placeholder="Your conclusions and analysis..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">External Links</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Enter URL (protocols, references, related papers, etc.)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={addLink}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add
              </button>
            </div>
            
            {formData.external_links.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-700">Added Links:</h4>
                {formData.external_links.map((link, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 truncate flex-1"
                    >
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-red-600 hover:text-red-800 ml-2 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Experiment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExperimentDetails = ({ experiment, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{experiment.title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Date</h4>
              <p className="text-gray-600">{new Date(experiment.date).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Status</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                experiment.results ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {experiment.results ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>

          {experiment.description && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">{experiment.description}</p>
            </div>
          )}

          {experiment.procedure && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Procedure</h4>
              <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">{experiment.procedure}</p>
            </div>
          )}

          {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Chemicals Used</h4>
              <div className="space-y-2">
                {experiment.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <span className="font-medium">{chemical.chemical_name}</span>
                    <span className="text-gray-600">{chemical.quantity_used} {chemical.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experiment.equipment_used && experiment.equipment_used.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Equipment Used</h4>
              <div className="flex flex-wrap gap-2">
                {experiment.equipment_used.map((equipment, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {equipment}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {experiment.observations && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Observations</h4>
                <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded text-sm">{experiment.observations}</p>
              </div>
            )}

            {experiment.results && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Results</h4>
                <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded text-sm">{experiment.results}</p>
              </div>
            )}

            {experiment.conclusions && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Conclusions</h4>
                <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded text-sm">{experiment.conclusions}</p>
              </div>
            )}
          </div>

          {experiment.external_links && experiment.external_links.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">External Links</h4>
              <div className="space-y-1">
                {experiment.external_links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-purple-600 hover:text-purple-800 break-all bg-gray-50 p-2 rounded"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChemicalInventory = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChemical, setEditingChemical] = useState(null);

  useEffect(() => {
    fetchChemicals();
  }, [searchTerm]);

  const fetchChemicals = async () => {
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await axios.get(`${API}/chemicals`, { params });
      setChemicals(response.data);
    } catch (error) {
      console.error('Failed to fetch chemicals:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChemical = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chemical?')) return;
    
    try {
      await axios.delete(`${API}/chemicals/${id}`);
      fetchChemicals();
    } catch (error) {
      console.error('Failed to delete chemical:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Chemical Inventory</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Chemical
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search chemicals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chemicals.map((chemical) => (
                <tr key={chemical.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{chemical.name}</div>
                    {chemical.low_stock_alert && chemical.quantity <= (chemical.low_stock_threshold || 0) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chemical.quantity} {chemical.unit}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{chemical.location}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{chemical.supplier || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chemical.expiration_date ? new Date(chemical.expiration_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingChemical(chemical)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteChemical(chemical.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chemicals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No chemicals found. Add your first chemical to get started!
            </div>
          )}
        </div>
      </div>

      {(showAddForm || editingChemical) && (
        <ChemicalForm
          chemical={editingChemical}
          onClose={() => {
            setShowAddForm(false);
            setEditingChemical(null);
          }}
          onSave={() => {
            fetchChemicals();
            setShowAddForm(false);
            setEditingChemical(null);
          }}
        />
      )}
    </div>
  );
};

const ChemicalForm = ({ chemical, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: chemical?.name || '',
    quantity: chemical?.quantity || '',
    unit: chemical?.unit || 'g',
    unit_type: chemical?.unit_type || 'weight',
    location: chemical?.location || '',
    safety_data: chemical?.safety_data || '',
    expiration_date: chemical?.expiration_date ? chemical.expiration_date.split('T')[0] : '',
    supplier: chemical?.supplier || '',
    notes: chemical?.notes || '',
    low_stock_alert: chemical?.low_stock_alert || false,
    low_stock_threshold: chemical?.low_stock_threshold || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        low_stock_threshold: formData.low_stock_threshold ? parseFloat(formData.low_stock_threshold) : null,
        expiration_date: formData.expiration_date ? new Date(formData.expiration_date).toISOString() : null
      };

      if (chemical) {
        await axios.put(`${API}/chemicals/${chemical.id}`, data);
      } else {
        await axios.post(`${API}/chemicals`, data);
      }
      
      onSave();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save chemical');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {chemical ? 'Edit Chemical' : 'Add Chemical'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
              <div className="flex space-x-2">
                <select
                  value={formData.unit_type}
                  onChange={(e) => setFormData({...formData, unit_type: e.target.value})}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weight">Weight</option>
                  <option value="volume">Volume</option>
                  <option value="amount">Amount</option>
                </select>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="g, kg, ml, L, pieces..."
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Safety Data</label>
            <textarea
              value={formData.safety_data}
              onChange={(e) => setFormData({...formData, safety_data: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.low_stock_alert}
                onChange={(e) => setFormData({...formData, low_stock_alert: e.target.checked})}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enable low stock alert</span>
            </label>

            {formData.low_stock_alert && (
              <div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                  placeholder="Threshold"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/activity-logs/stats/summary`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'roles', label: 'Role Management', icon: '🔐' },
    { id: 'activity', label: 'Activity Log', icon: '📋' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {currentTab === 'overview' && <AdminOverview stats={stats} loading={loading} />}
          {currentTab === 'users' && <UserManagement />}
          {currentTab === 'roles' && <RoleManagement />}
          {currentTab === 'activity' && <ActivityLog />}
        </div>
      </div>
    </div>
  );
};

const AdminOverview = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
      
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-blue-800">Total Activity Logs</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total_logs}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-green-800">Recent Activity (24h)</h3>
              <p className="text-3xl font-bold text-green-600">{stats.recent_activity}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-purple-800">Action Types</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.action_stats?.length || 0}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold text-orange-800">Resource Types</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.resource_stats?.length || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Statistics */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by Action Type</h3>
              <div className="space-y-3">
                {stats.action_stats?.slice(0, 5).map((stat) => (
                  <div key={stat._id} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{stat._id}</span>
                    <span className="text-sm text-gray-600">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Users */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
              <div className="space-y-3">
                {stats.most_active_users?.slice(0, 5).map((stat) => (
                  <div key={stat._id} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{stat._id}</span>
                    <span className="text-sm text-gray-600">{stat.count} actions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    user_email: '',
    date_from: '',
    date_to: ''
  });
  const [expandedLog, setExpandedLog] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      
      const response = await axios.get(`${API}/admin/activity-logs`, { params });
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const showLogDetails = async (logId) => {
    try {
      const response = await axios.get(`${API}/admin/activity-logs/${logId}`);
      setSelectedLog(response.data);
    } catch (error) {
      console.error('Failed to fetch log details:', error);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-gray-100 text-gray-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getResourceColor = (resourceType) => {
    const colors = {
      'User': 'bg-blue-100 text-blue-800',
      'Role': 'bg-indigo-100 text-indigo-800',
      'Chemical': 'bg-green-100 text-green-800',
      'Experiment': 'bg-purple-100 text-purple-800',
      'Authentication': 'bg-yellow-100 text-yellow-800'
    };
    return colors[resourceType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Activity Log</h2>
        <span className="text-sm text-gray-600">{logs.length} entries</span>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <select
            value={filters.action}
            onChange={(e) => setFilters({...filters, action: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>

          <select
            value={filters.resource_type}
            onChange={(e) => setFilters({...filters, resource_type: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Resources</option>
            <option value="User">User</option>
            <option value="Role">Role</option>
            <option value="Chemical">Chemical</option>
            <option value="Experiment">Experiment</option>
            <option value="Authentication">Authentication</option>
          </select>

          <input
            type="text"
            placeholder="User email..."
            value={filters.user_email}
            onChange={(e) => setFilters({...filters, user_email: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResourceColor(log.resource_type)}`}>
                        {log.resource_type}
                      </span>
                      {log.resource_name && (
                        <div className="text-xs text-gray-500 mt-1">{log.resource_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.summary}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => showLogDetails(log.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No activity logs found. Apply different filters or check back later.
            </div>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Activity Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedLog.user_email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resource</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResourceColor(selectedLog.resource_type)}`}>
                    {selectedLog.resource_type}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <p className="text-sm text-gray-900">{selectedLog.summary}</p>
              </div>

              {selectedLog.resource_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resource Name</label>
                  <p className="text-sm text-gray-900">{selectedLog.resource_name}</p>
                </div>
              )}

              {Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API}/roles`);
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get(`${API}/permissions`);
      setPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const deleteRole = async (roleName, displayName) => {
    if (!window.confirm(`Are you sure you want to delete role "${displayName}"?`)) return;
    
    try {
      await axios.delete(`${API}/roles/${roleName}`);
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert(error.response?.data?.detail || 'Failed to delete role');
    }
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Role Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.name} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
            role.is_system ? 'border-blue-500' : 'border-green-500'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">{role.display_name}</h3>
                  {role.is_system && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      System
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingRole(role)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                >
                  Edit
                </button>
                {!role.is_system && (
                  <button
                    onClick={() => deleteRole(role.name, role.display_name)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions ({role.permissions.length})</h4>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 8).map((permName) => {
                  const perm = permissions.find(p => p.name === permName);
                  return (
                    <span
                      key={permName}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        perm?.category === 'chemicals' ? 'bg-blue-100 text-blue-800' :
                        perm?.category === 'experiments' ? 'bg-purple-100 text-purple-800' :
                        perm?.category === 'users' ? 'bg-green-100 text-green-800' :
                        perm?.category === 'roles' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {perm?.description || permName}
                    </span>
                  );
                })}
                {role.permissions.length > 8 && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    +{role.permissions.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(showAddForm || editingRole) && (
        <RoleForm
          role={editingRole}
          permissions={permissions}
          permissionsByCategory={permissionsByCategory}
          onClose={() => {
            setShowAddForm(false);
            setEditingRole(null);
          }}
          onSave={() => {
            fetchRoles();
            setShowAddForm(false);
            setEditingRole(null);
          }}
        />
      )}
    </div>
  );
};

const RoleForm = ({ role, permissions, permissionsByCategory, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    display_name: role?.display_name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role) {
        // Update existing role
        await axios.put(`${API}/roles/${role.name}`, {
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions
        });
      } else {
        // Create new role
        await axios.post(`${API}/roles`, formData);
      }
      
      onSave();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionName) => {
    const newPermissions = formData.permissions.includes(permissionName)
      ? formData.permissions.filter(p => p !== permissionName)
      : [...formData.permissions, permissionName];
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const toggleCategoryPermissions = (category) => {
    const categoryPerms = permissionsByCategory[category] || [];
    const categoryPermNames = categoryPerms.map(p => p.name);
    const hasAllCategoryPerms = categoryPermNames.every(p => formData.permissions.includes(p));
    
    let newPermissions;
    if (hasAllCategoryPerms) {
      // Remove all category permissions
      newPermissions = formData.permissions.filter(p => !categoryPermNames.includes(p));
    } else {
      // Add all category permissions
      newPermissions = [...new Set([...formData.permissions, ...categoryPermNames])];
    }
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {role ? `Edit Role: ${role.display_name}` : 'Create New Role'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., lab_manager"
                required
                disabled={!!role} // Cannot change name of existing role
              />
              {!role && (
                <p className="text-xs text-gray-500 mt-1">
                  Use lowercase with underscores (e.g., lab_manager)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Lab Manager"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe the purpose and scope of this role..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Permissions ({formData.permissions.length} selected)
            </label>
            
            <div className="space-y-4">
              {Object.entries(permissionsByCategory).map(([category, perms]) => {
                const categoryPermNames = perms.map(p => p.name);
                const hasAllCategoryPerms = categoryPermNames.every(p => formData.permissions.includes(p));
                const hasSomeCategoryPerms = categoryPermNames.some(p => formData.permissions.includes(p));

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 capitalize">{category}</h4>
                      <button
                        type="button"
                        onClick={() => toggleCategoryPermissions(category)}
                        className={`text-xs px-3 py-1 rounded ${
                          hasAllCategoryPerms 
                            ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {hasAllCategoryPerms ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {perms.map((permission) => (
                        <label
                          key={permission.name}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.name)}
                            onChange={() => togglePermission(permission.name)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {permission.description}
                            </span>
                            <p className="text-xs text-gray-500">{permission.name}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      
      const response = await axios.get(`${API}/admin/users`, { params });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete user "${email}"?`)) return;
    
    try {
      await axios.delete(`${API}/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API}/admin/users/${userId}`, {
        is_active: !currentStatus
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert(error.response?.data?.detail || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 flex space-x-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="researcher">Researcher</option>
            <option value="student">Student</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'researcher' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'student' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={user.is_active ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found. Add your first user to get started!
            </div>
          )}
        </div>
      </div>

      {(showAddForm || editingUser) && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowAddForm(false);
            setEditingUser(null);
          }}
          onSave={() => {
            fetchUsers();
            setShowAddForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

const UserForm = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: user?.role || 'guest',
    is_active: user?.is_active !== undefined ? user.is_active : true
  });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API}/roles`);
      setAvailableRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords for new users or when password is provided
    if (!user || formData.password) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      if (!user && !formData.password) {
        setError('Password is required for new users');
        setLoading(false);
        return;
      }
    }

    try {
      const data = {
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active
      };

      // Only include password if provided
      if (formData.password) {
        data.password = formData.password;
      }

      if (user) {
        await axios.put(`${API}/admin/users/${user.id}`, data);
      } else {
        data.password = formData.password; // Required for new users
        await axios.post(`${API}/admin/users`, data);
      }
      
      onSave();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {user ? 'Edit User' : 'Add User'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!user} // Cannot change email for existing users
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {user ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!user}
            />
          </div>

          {(!user || formData.password) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {availableRoles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active User
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Navigation = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserPermissions();
    }
  }, [user]);

  const fetchUserPermissions = async () => {
    try {
      const response = await axios.get(`${API}/roles/${user.role}`);
      setUserPermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      // Fallback to basic permissions based on role
      const fallbackPermissions = {
        admin: ["read", "write", "delete", "manage_users", "manage_roles"],
        researcher: ["read", "write", "delete"],
        student: ["read", "write"],
        guest: ["read"]
      };
      setUserPermissions(fallbackPermissions[user?.role] || []);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', permission: 'view_dashboard' },
    { id: 'chemicals', label: 'Chemical Inventory', permission: 'read_chemicals' },
    { id: 'experiments', label: 'Experiments', permission: 'read_experiments' },
    { id: 'admin', label: 'Admin Panel', permission: 'manage_users' }
  ];

  const hasPermission = (permission) => {
    // Check both new permission names and legacy ones
    return userPermissions.includes(permission) || 
           userPermissions.includes('system_admin') ||
           (permission === 'view_dashboard' && userPermissions.includes('read')) ||
           (permission === 'read_chemicals' && userPermissions.includes('read')) ||
           (permission === 'read_experiments' && userPermissions.includes('read'));
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">Lab Journal</h1>
            
            <div className="flex space-x-4">
              {navItems.map((item) => (
                hasPermission(item.permission) && (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.email} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AuthenticatedApp 
          showLogin={showLogin} 
          setShowLogin={setShowLogin}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      </div>
    </AuthProvider>
  );
};

const AuthenticatedApp = ({ showLogin, setShowLogin, currentView, setCurrentView }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {showLogin ? (
          <LoginForm onToggle={() => setShowLogin(false)} />
        ) : (
          <RegisterForm onToggle={() => setShowLogin(true)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'chemicals' && <ChemicalInventory />}
          {currentView === 'experiments' && <ExperimentJournal />}
          {currentView === 'admin' && <AdminPanel />}
        </div>
      </main>
    </div>
  );
};

export default App;