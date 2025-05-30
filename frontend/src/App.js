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
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
          <strong>Demo Login:</strong><br />
          Email: admin@lab.com<br />
          Password: admin123
        </div>
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

          <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-red-800">Low Stock</h3>
            <p className="text-3xl font-bold text-red-600">{stats.low_stock_count}</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-yellow-800">Expiring Soon</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.expiring_soon_count}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-800">Recent Additions</h3>
            <p className="text-3xl font-bold text-green-600">{stats.recent_additions}</p>
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
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((experiment) => (
            <div key={experiment.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{experiment.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(experiment.date).toLocaleDateString()}
                </span>
              </div>
              
              {experiment.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{experiment.description}</p>
              )}
              
              {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {experiment.chemicals_used.length} chemical(s) used
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingExperiment(experiment)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
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
                
                {experiment.results && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    Completed
                  </span>
                )}
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
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
            <textarea
              value={formData.procedure}
              onChange={(e) => setFormData({...formData, procedure: e.target.value})}
              rows="4"
              placeholder="Describe the experimental procedure..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Chemicals Used Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chemicals Used</label>
            <div className="flex space-x-2 mb-2">
              <select
                value={selectedChemical}
                onChange={(e) => setSelectedChemical(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a chemical</option>
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
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addChemical}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.chemicals_used.length > 0 && (
              <div className="space-y-1">
                {formData.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>
                      {chemical.chemical_name} - {chemical.quantity_used} {chemical.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChemical(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Equipment Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Used</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Enter equipment name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addEquipment}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.equipment_used.length > 0 && (
              <div className="space-y-1">
                {formData.equipment_used.map((equipment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{equipment}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="text-red-600 hover:text-red-800"
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
                placeholder="Record your observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
              <textarea
                value={formData.results}
                onChange={(e) => setFormData({...formData, results: e.target.value})}
                rows="4"
                placeholder="Document your results..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conclusions</label>
              <textarea
                value={formData.conclusions}
                onChange={(e) => setFormData({...formData, conclusions: e.target.value})}
                rows="4"
                placeholder="Your conclusions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* External Links Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">External Links</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="Enter URL (protocols, references, etc.)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addLink}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.external_links.length > 0 && (
              <div className="space-y-1">
                {formData.external_links.map((link, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{experiment.title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
              <p className="text-gray-600">{experiment.description}</p>
            </div>
          )}

          {experiment.procedure && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Procedure</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{experiment.procedure}</p>
            </div>
          )}

          {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Chemicals Used</h4>
              <div className="space-y-2">
                {experiment.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
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
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
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
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.observations}</p>
              </div>
            )}

            {experiment.results && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Results</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.results}</p>
              </div>
            )}

            {experiment.conclusions && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Conclusions</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.conclusions}</p>
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
                    className="block text-blue-600 hover:text-blue-800 break-all"
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
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((experiment) => (
            <div key={experiment.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{experiment.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(experiment.date).toLocaleDateString()}
                </span>
              </div>
              
              {experiment.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{experiment.description}</p>
              )}
              
              {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {experiment.chemicals_used.length} chemical(s) used
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingExperiment(experiment)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
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
                
                {experiment.results && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    Completed
                  </span>
                )}
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
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
            <textarea
              value={formData.procedure}
              onChange={(e) => setFormData({...formData, procedure: e.target.value})}
              rows="4"
              placeholder="Describe the experimental procedure..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chemicals Used</label>
            <div className="flex space-x-2 mb-2">
              <select
                value={selectedChemical}
                onChange={(e) => setSelectedChemical(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a chemical</option>
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
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addChemical}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.chemicals_used.length > 0 && (
              <div className="space-y-1">
                {formData.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>
                      {chemical.chemical_name} - {chemical.quantity_used} {chemical.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChemical(index)}
                      className="text-red-600 hover:text-red-800"
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
                placeholder="Enter equipment name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addEquipment}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.equipment_used.length > 0 && (
              <div className="space-y-1">
                {formData.equipment_used.map((equipment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{equipment}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="text-red-600 hover:text-red-800"
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
                placeholder="Record your observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
              <textarea
                value={formData.results}
                onChange={(e) => setFormData({...formData, results: e.target.value})}
                rows="4"
                placeholder="Document your results..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conclusions</label>
              <textarea
                value={formData.conclusions}
                onChange={(e) => setFormData({...formData, conclusions: e.target.value})}
                rows="4"
                placeholder="Your conclusions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="Enter URL (protocols, references, etc.)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addLink}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.external_links.length > 0 && (
              <div className="space-y-1">
                {formData.external_links.map((link, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{experiment.title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
              <p className="text-gray-600">{experiment.description}</p>
            </div>
          )}

          {experiment.procedure && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Procedure</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{experiment.procedure}</p>
            </div>
          )}

          {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Chemicals Used</h4>
              <div className="space-y-2">
                {experiment.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
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
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
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
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.observations}</p>
              </div>
            )}

            {experiment.results && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Results</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.results}</p>
              </div>
            )}

            {experiment.conclusions && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Conclusions</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.conclusions}</p>
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
                    className="block text-blue-600 hover:text-blue-800 break-all"
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
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((experiment) => (
            <div key={experiment.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{experiment.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(experiment.date).toLocaleDateString()}
                </span>
              </div>
              
              {experiment.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{experiment.description}</p>
              )}
              
              {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {experiment.chemicals_used.length} chemical(s) used
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingExperiment(experiment)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
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
                
                {experiment.results && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    Completed
                  </span>
                )}
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
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
            <textarea
              value={formData.procedure}
              onChange={(e) => setFormData({...formData, procedure: e.target.value})}
              rows="4"
              placeholder="Describe the experimental procedure..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chemicals Used</label>
            <div className="flex space-x-2 mb-2">
              <select
                value={selectedChemical}
                onChange={(e) => setSelectedChemical(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a chemical</option>
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
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addChemical}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.chemicals_used.length > 0 && (
              <div className="space-y-1">
                {formData.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>
                      {chemical.chemical_name} - {chemical.quantity_used} {chemical.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChemical(index)}
                      className="text-red-600 hover:text-red-800"
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
                placeholder="Enter equipment name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addEquipment}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.equipment_used.length > 0 && (
              <div className="space-y-1">
                {formData.equipment_used.map((equipment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{equipment}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="text-red-600 hover:text-red-800"
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
                placeholder="Record your observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
              <textarea
                value={formData.results}
                onChange={(e) => setFormData({...formData, results: e.target.value})}
                rows="4"
                placeholder="Document your results..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conclusions</label>
              <textarea
                value={formData.conclusions}
                onChange={(e) => setFormData({...formData, conclusions: e.target.value})}
                rows="4"
                placeholder="Your conclusions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="Enter URL (protocols, references, etc.)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addLink}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {formData.external_links.length > 0 && (
              <div className="space-y-1">
                {formData.external_links.map((link, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate"
                    >
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
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
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">{experiment.title}</h3>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
              <p className="text-gray-600">{experiment.description}</p>
            </div>
          )}

          {experiment.procedure && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Procedure</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{experiment.procedure}</p>
            </div>
          )}

          {experiment.chemicals_used && experiment.chemicals_used.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Chemicals Used</h4>
              <div className="space-y-2">
                {experiment.chemicals_used.map((chemical, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
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
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
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
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.observations}</p>
              </div>
            )}

            {experiment.results && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Results</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.results}</p>
              </div>
            )}

            {experiment.conclusions && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Conclusions</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{experiment.conclusions}</p>
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
                    className="block text-blue-600 hover:text-blue-800 break-all"
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

const UserManagement = () => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
              <option value="guest">Guest</option>
              <option value="student">Student</option>
              <option value="researcher">Researcher</option>
              <option value="admin">Admin</option>
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', permission: 'read' },
    { id: 'chemicals', label: 'Chemical Inventory', permission: 'read' },
    { id: 'experiments', label: 'Experiments', permission: 'read' },
    { id: 'users', label: 'User Management', permission: 'manage_users' }
  ];

  const hasPermission = (permission) => {
    const userPermissions = {
      admin: ["read", "write", "delete", "manage_users", "manage_roles"],
      researcher: ["read", "write", "delete"],
      student: ["read", "write"],
      guest: ["read"]
    };
    
    return userPermissions[user?.role]?.includes(permission) || false;
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
          {currentView === 'users' && <UserManagement />}
        </div>
      </main>
    </div>
  );
};

export default App;