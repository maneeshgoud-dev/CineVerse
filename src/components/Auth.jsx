import React, { useState } from "react";
import { loginUser, registerUser, logoutUser } from "../appwrite";

const Auth = ({ user, onUserChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await loginUser(formData.email, formData.password);
      } else {
        result = await registerUser(
          formData.email,
          formData.password,
          formData.name || "User",
        );
      }
      onUserChange(result);
      setShowModal(false);
      setFormData({ email: "", password: "", name: "" });
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onUserChange(null);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="auth-user-info">
        <span className="user-name">{user.name || user.email}</span>
        <button
          className="auth-logout-btn"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="auth-login-btn" onClick={() => setShowModal(true)}>
        Sign In
      </button>

      {showModal && (
        <div className="auth-overlay" onClick={() => setShowModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close" onClick={() => setShowModal(false)}>
              ✕
            </button>

            <h2>{isLogin ? "Sign In" : "Sign Up"}</h2>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="auth-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                  />
                </div>
              )}

              <div className="auth-form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading
                  ? isLogin
                    ? "Signing in..."
                    : "Creating account..."
                  : isLogin
                    ? "Sign In"
                    : "Sign Up"}
              </button>
            </form>

            <div className="auth-toggle">
              <p>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setFormData({ email: "", password: "", name: "" });
                }}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Auth;
