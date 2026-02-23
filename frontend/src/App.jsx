import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from "./pages/login"
import Signup from './pages/participant/signup';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import ParticipantLayout from './layouts/Participant';
import { Navigate } from 'react-router-dom';
import Profile from './pages/participant/Profile';
import OrganizerLayout from './layouts/Organizer';
import OrganizerDashboard from './pages/organizers/dashboard';
import EventCard from './pages/organizers/eventCard';
import OrganizerProfile from './pages/organizers/profile';
import ParticipantEvents from './pages/participant/events';
import EventDetail from './pages/participant/eventDetail';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import AdminLayout from './layouts/Admin';
import AdminDashboard from './pages/admin/dashboard';
import AdminEventDetail from './pages/admin/eventDetail';
import ManageClubs from './pages/admin/manageClubs';
import PasswordReset from './pages/admin/passwordReset';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <div className="content-container">
            <Routes>
              {/** these are public routes - anyone can reach and access */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              {/** These gonna be our protected routes only for participant */}
              <Route element={<ProtectedRoute allowedRoles={['participant']} />}>
                <Route element={<ParticipantLayout />}>

                  <Route path="/browse" element={<ParticipantEvents />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/dashboard" element={<ParticipantDashboard />} />

                </Route>
              </Route>

              {/** These are our organizer's routes */}
              <Route element={<ProtectedRoute allowedRoles={['organizer']} />}>
                <Route element={<OrganizerLayout />}>
                  <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
                  <Route path="/organizer/create" element={<EventCard />} />
                  <Route path="/organizer/event/:id" element={<EventCard />} />
                  <Route path="/organizer/profile" element={<OrganizerProfile />} />
                </Route>
              </Route>

              {/** These are our admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/events/:id" element={<AdminEventDetail />} />
                  <Route path="/admin/clubs" element={<ManageClubs />} />
                  <Route path="/admin/reset" element={<PasswordReset />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
