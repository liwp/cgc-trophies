import { Navigate, Route, Routes } from "react-router-dom";
import Admin from "./pages/admin";
import Components from "./pages/components";
import Home from "./pages/index";
import TrophyDetail from "./pages/trophy/trophyDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/components" element={<Components />} />
      <Route path="/trophy/:trophyId" element={<TrophyDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
