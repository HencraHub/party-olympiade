import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import JoinPage from './pages/JoinPage.jsx';
import HostRoomPage from './pages/HostRoomPage.jsx';
import ParticipantView from './pages/ParticipantView.jsx';
import WinnerPage from './pages/WinnerPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/room/:code" element={<ParticipantView />} />
        <Route path="/room/:code/host" element={<HostRoomPage />} />
        <Route path="/room/:code/winner" element={<WinnerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
