import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans text-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          {/* Admin Routes moved to separate Admin Panel application */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
