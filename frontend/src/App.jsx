import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PartMasterPage from "./pages/PartMasterPage";
import PartProfilePage from "./pages/PartProfilePage";
import OperationsMasterPage from "./pages/OperationsMasterPage";
import MachineDashboard from "./modules/machine/MachineDashboard";
import MachineProfilePage from "./modules/machine/MachineProfilePage";
import { I18nProvider } from "./context/I18nContext";

function getSavedUser() {
  try {
    const saved = sessionStorage.getItem("rico_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    sessionStorage.removeItem("rico_user");
    return null;
  }
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem("rico_auth") === "true"
  );
  const [currentUser, setCurrentUser] = useState(() => getSavedUser());

  const handleLogin = (username) => {
    const user = {
      name: username?.trim() || "Admin",
      role: username?.trim()?.toLowerCase() === "operator" ? "Operator" : "Administrator",
    };
    sessionStorage.setItem("rico_auth", "true");
    sessionStorage.setItem("rico_user", JSON.stringify(user));
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("rico_auth");
    sessionStorage.removeItem("rico_user");
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  return (
    <I18nProvider>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/parts" />} />
          <Route path="/parts" element={<PartMasterPage onLogout={handleLogout} currentUser={currentUser} />} />
          <Route path="/part-operations/part-master" element={<Navigate to="/parts" />} />
          <Route path="/part/:id" element={<PartProfilePage onLogout={handleLogout} currentUser={currentUser} />} />
          <Route path="/organisation-master/part-master" element={<Navigate to="/parts" />} />
          <Route path="/organisation-master/machines" element={<Navigate to="/machines" />} />
          <Route path="/part-operations/machine-master" element={<Navigate to="/machines" />} />
          <Route path="/machines" element={<MachineDashboard onLogout={handleLogout} currentUser={currentUser} />} />
          <Route path="/machine/:id" element={<MachineProfilePage onLogout={handleLogout} currentUser={currentUser} />} />
          <Route path="/operations" element={<OperationsMasterPage onLogout={handleLogout} currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </I18nProvider>
  );
};

export default App;