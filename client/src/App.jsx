import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import FreemiumBanner from './components/ui/FreemiumBanner'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import Learn from './pages/Learn'
import Module from './pages/Module'
import Dashboard from './pages/Dashboard'
import Complete from './pages/Complete'
import Passport from './pages/Passport'
import NotFound from './pages/NotFound'
import AuthCallback from './pages/AuthCallback'

function App() {
  return (
    <AuthProvider>
      <Router>
        <FreemiumBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/module/:curriculumId/:moduleIndex" element={<Module />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/complete/:id" element={<Complete />} />
          <Route path="/passport" element={<Passport />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App