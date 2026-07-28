import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DashboardEstudiante from './pages/DashboardEstudiante';
import DashboardTutor from './pages/DashboardTutor';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/estudiante" element={<DashboardEstudiante />} />
      <Route path="/tutor" element={<DashboardTutor />} />
    </Routes>
  );
}
