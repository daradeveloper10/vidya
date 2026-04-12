import axios from 'axios';

// Create axios instance for API calls
// Using relative paths because Vite proxy handles routing to backend
const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
