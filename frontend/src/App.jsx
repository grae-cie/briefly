import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import LandingPage from "./LandingPage/LandingPage";
import Login from "./LoginPage/login";
import HomePage from "./HomePage/HomePage";
import History from "./History/History";
import ViewSummary from "./History/ViewSummary";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // Load logged-in user from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Handles login
  const handleLogin = (username) => {
    setCurrentUser(username);
    localStorage.setItem("currentUser", JSON.stringify(username));
  };

  // Handles logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/login" />
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Login Page */}
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/home" />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* Homepage */}
        <Route
          path="/home"
          element={
            currentUser ? (
              <HomePage
                user={currentUser.trim().toUpperCase()}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* History Page */}
        <Route
          path="/history"
          element={
            currentUser ? (
              <History
                user={currentUser.trim().toUpperCase()}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/view"
          element={
            currentUser ? (
              <ViewSummary
                user={currentUser.trim().toUpperCase()}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;