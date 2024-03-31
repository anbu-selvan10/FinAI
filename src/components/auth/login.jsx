import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  doSignInWithEmailAndPassword,
  doSignInWithGoogle,
  doPasswordReset,
} from "../../config/auth";
import { useAuth } from "../AuthContext";
import "../../styles/login.css";

const Login = () => {
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithEmailAndPassword(email, password);
      } catch (error) {
        setIsSigningIn(false);
        setErrorMessage(error.message);
      }
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      try {
        await doSignInWithGoogle();
      } catch (error) {
        setIsSigningIn(false);
        setErrorMessage(error.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    try {
      await doPasswordReset(email);
      alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div>
      {userLoggedIn && <Navigate to={"/home"} replace={true} />}

      <main className="main">
        <div className="container">
          <div className="text-center">
            <div className="mt-2">
              <h3>Welcome Back</h3>
            </div>
          </div>
          <form onSubmit={onSubmit} className="form">
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </div>
            {errorMessage && (
              <span className="error-message">{errorMessage}</span> // Display error message if present
            )}
            <button
              type="submit"
              disabled={isSigningIn}
              className={`button ${isSigningIn ? "disabled" : ""}`}
            >
              {isSigningIn ? "Signing In..." : "Sign In"}
            </button>
            <div className="forgot-password">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isSigningIn}
                className="forgot-password-button"
              >
                Forgot Password?
              </button>
            </div>
          </form>
          <p className="sign-up">
            Don't have an account? <Link to={"/register"}>Sign up</Link>
          </p>
          <div className="or-divider">
            <div className="divider-line"></div>
            <div className="divider-text">OR</div>
            <div className="divider-line"></div>
          </div>
          <button
            disabled={isSigningIn}
            onClick={(e) => {
              onGoogleSignIn(e);
            }}
            className={`google-button ${isSigningIn ? "disabled" : ""}`}
          >
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            ></svg>
            {isSigningIn ? "Signing In..." : "Continue with Google"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Login;
