import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { AuctionProvider } from './contexts/AuctionContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Components
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import LoginTest from './components/auth/LoginTest';
import ConnectionTest from './components/auth/ConnectionTest';
import PasswordReset from './components/auth/PasswordReset';
import Dashboard from './components/dashboard/Dashboard';
import TournamentList from './components/tournaments/TournamentList';
import TournamentDetails from './components/tournaments/TournamentDetails';
import TournamentEdit from './components/tournaments/TournamentEdit';
import MatchDetails from './components/matches/MatchDetails';
import TeamDetails from './components/teams/TeamDetails';
import PlayerList from './components/players/PlayerList';
import PlayerDetails from './components/players/PlayerDetails';
import PlayerEdit from './components/players/PlayerEdit';
import PlayerView from './components/players/PlayerView';
import AuctionList from './components/auctions/AuctionList';
import AuctionDetails from './components/auctions/AuctionDetails';
import AuctionEdit from './components/auctions/AuctionEdit';
import LiveAuction from './components/auctions/LiveAuction';
import AuctionMonitor from './components/auctions/AuctionMonitor';
import AuctionView from './components/auctions/AuctionView';
import PlayerCreate from './components/players/PlayerCreate';
import TeamCreate from './components/teams/TeamCreate';
import TeamView from './components/teams/TeamView';
import AuctionCreate from './components/auctions/AuctionCreate';
import AuctionLive from './components/auctions/AuctionLive';
import Profile from './components/profile/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <SocketProvider>
            <AuctionProvider>
              <div className="content-wrapper">
                <Navbar />
                <Container>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login-test" element={<LoginTest />} />
                    <Route path="/connection-test" element={<ConnectionTest />} />
                    <Route path="/reset-password" element={<PasswordReset />} />

                    {/* Protected routes */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />

                    {/* Tournament Routes */}
                    <Route path="/tournaments" element={
                      <ProtectedRoute>
                        <TournamentList />
                      </ProtectedRoute>
                    } />
                    <Route path="/tournaments/create" element={
                      <AdminRoute>
                        <TournamentEdit />
                      </AdminRoute>
                    } />
                    <Route path="/tournaments/:id" element={
                      <ProtectedRoute>
                        <TournamentDetails />
                      </ProtectedRoute>
                    } />
                    <Route path="/tournaments/:id/edit" element={
                      <AdminRoute>
                        <TournamentEdit />
                      </AdminRoute>
                    } />

                    {/* Match Routes */}
                    <Route path="/matches/:id" element={
                      <ProtectedRoute>
                        <MatchDetails />
                      </ProtectedRoute>
                    } />

                    {/* Team Routes */}
                    <Route path="/teams/:id" element={
                      <ProtectedRoute>
                        <TeamDetails />
                      </ProtectedRoute>
                    } />

                    {/* Player Routes */}
                    <Route path="/players" element={
                      <ProtectedRoute>
                        <PlayerList />
                      </ProtectedRoute>
                    } />
                    <Route path="/players/create" element={
                      <ProtectedRoute>
                        <PlayerCreate />
                      </ProtectedRoute>
                    } />
                    <Route path="/players/:id" element={
                      <ProtectedRoute>
                        <PlayerView />
                      </ProtectedRoute>
                    } />
                    <Route path="/players/:id/edit" element={
                      <ProtectedRoute>
                        <PlayerEdit />
                      </ProtectedRoute>
                    } />

                    {/* Auction Routes */}
                    <Route path="/auctions" element={
                      <ProtectedRoute>
                        <AuctionList />
                      </ProtectedRoute>
                    } />
                    <Route path="/auctions/create" element={
                      <AdminRoute>
                        <AuctionCreate />
                      </AdminRoute>
                    } />
                    <Route path="/auctions/:id" element={
                      <ProtectedRoute>
                        <AuctionView />
                      </ProtectedRoute>
                    } />
                    <Route path="/auctions/:id/edit" element={
                      <AdminRoute>
                        <AuctionEdit />
                      </AdminRoute>
                    } />
                    <Route path="/auctions/:id/live" element={
                      <ProtectedRoute>
                        <AuctionLive />
                      </ProtectedRoute>
                    } />
                    <Route path="/auctions/:id/monitor" element={
                      <AdminRoute>
                        <AuctionMonitor />
                      </AdminRoute>
                    } />

                    {/* Team Routes */}
                    <Route path="/teams/create" element={
                      <ProtectedRoute>
                        <TeamCreate />
                      </ProtectedRoute>
                    } />
                    <Route path="/teams/my-team" element={
                      <ProtectedRoute>
                        <TeamView />
                      </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/login" />} />
                  </Routes>
                </Container>
              </div>
            </AuctionProvider>
          </SocketProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
