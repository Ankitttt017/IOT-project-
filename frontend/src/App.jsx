import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PartMasterPage from "./pages/PartMasterPage";
import PartProfilePage from "./pages/PartProfilePage";
import { I18nProvider } from "./context/I18nContext";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem("rico_auth") === "true"
  );

  const handleLogin = () => {
    sessionStorage.setItem("rico_auth", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("rico_auth");
    setIsLoggedIn(false);
  };

  return (
    <I18nProvider>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Routes>
          <Route path="/" element={<PartMasterPage onLogout={handleLogout} />} />
          <Route path="/part/:id" element={<PartProfilePage onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </I18nProvider>
  );
};

export default App;
