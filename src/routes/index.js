import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Components
import Layout from '../components/Layout';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import Dashboard from '../components/Dashboard';
import PlayerList from '../components/players/PlayerList';
import PlayerCreate from '../components/players/PlayerCreate';
import PlayerEdit from '../components/players/PlayerEdit';
import PlayerView from '../components/players/PlayerView';
import TeamList from '../components/teams/TeamList';
import TeamCreate from '../components/teams/TeamCreate';
import TeamEdit from '../components/teams/TeamEdit';
import TeamView from '../components/teams/TeamView';
import AuctionList from '../components/auctions/AuctionList';
import AuctionCreate from '../components/auctions/AuctionCreate';
import AuctionEdit from '../components/auctions/AuctionEdit';
import AuctionView from '../components/auctions/AuctionView';
import LiveAuction from '../components/auctions/LiveAuction';
import TournamentList from '../components/tournaments/TournamentList';
import TournamentCreate from '../components/tournaments/TournamentCreate';
import TournamentEdit from '../components/tournaments/TournamentEdit';
import TournamentView from '../components/tournaments/TournamentView';

const PrivateRoute = ({ children, roles }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={
                <PrivateRoute>
                    <Layout />
                </PrivateRoute>
            }>
                <Route index element={<Dashboard />} />

                {/* Player Routes */}
                <Route path="players">
                    <Route index element={<PlayerList />} />
                    <Route path="create" element={
                        <PrivateRoute roles={['admin']}>
                            <PlayerCreate />
                        </PrivateRoute>
                    } />
                    <Route path=":id/edit" element={
                        <PrivateRoute roles={['admin']}>
                            <PlayerEdit />
                        </PrivateRoute>
                    } />
                    <Route path=":id" element={<PlayerView />} />
                </Route>

                {/* Team Routes */}
                <Route path="teams">
                    <Route index element={<TeamList />} />
                    <Route path="create" element={
                        <PrivateRoute roles={['admin', 'team_owner']}>
                            <TeamCreate />
                        </PrivateRoute>
                    } />
                    <Route path=":id/edit" element={
                        <PrivateRoute roles={['admin']}>
                            <TeamEdit />
                        </PrivateRoute>
                    } />
                    <Route path=":id" element={<TeamView />} />
                </Route>

                {/* Auction Routes */}
                <Route path="auctions">
                    <Route index element={<AuctionList />} />
                    <Route path="create" element={
                        <PrivateRoute roles={['admin']}>
                            <AuctionCreate />
                        </PrivateRoute>
                    } />
                    <Route path=":id/edit" element={
                        <PrivateRoute roles={['admin']}>
                            <AuctionEdit />
                        </PrivateRoute>
                    } />
                    <Route path=":id" element={<AuctionView />} />
                    <Route path=":id/live" element={
                        <PrivateRoute roles={['admin', 'team_owner']}>
                            <LiveAuction />
                        </PrivateRoute>
                    } />
                </Route>

                {/* Tournament Routes */}
                <Route path="tournaments">
                    <Route index element={<TournamentList />} />
                    <Route path="create" element={
                        <PrivateRoute roles={['admin']}>
                            <TournamentCreate />
                        </PrivateRoute>
                    } />
                    <Route path=":id/edit" element={
                        <PrivateRoute roles={['admin']}>
                            <TournamentEdit />
                        </PrivateRoute>
                    } />
                    <Route path=":id" element={<TournamentView />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default AppRoutes; 