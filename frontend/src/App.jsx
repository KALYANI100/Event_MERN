import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { PrivateRoute } from "./components/PrivateRoute.jsx";
import Admin from "./pages/Admin.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import Events from "./pages/Events.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import MyRegistrations from "./pages/MyRegistrations.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route
          path="/my-registrations"
          element={
            <PrivateRoute>
              <MyRegistrations />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
