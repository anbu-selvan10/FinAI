import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  doCreateUserWithEmailAndPassword,
  doSendEmailVerification,
} from "../../config/auth";
import "../../styles/signup.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  const { userLoggedIn } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!isRegistering) {
      setIsRegistering(true);
      try {
        await doCreateUserWithEmailAndPassword(email, password);
        await doSendEmailVerification();
        setVerificationSent(true);
      } catch (error) {
        setIsRegistering(false);
        setErrorMessage(error.message);
      }
    }
  };

  const handleVerificationNavigation = () => {
    const isEmailVerified = userLoggedIn && userLoggedIn.emailVerified;
    if (isEmailVerified) {
      return <Navigate to={"/home"} replace={true} />;
    } else {
      return (
        <span className="verification-error">
          Please signup and verify your email to access the home page.
        </span>
      );
    }
  };

  return (
    <>
      {handleVerificationNavigation()}

      <main className="main">
        <div className="container">
          <div className="text-center mb-6">
            <div className="mt-2">
              <h3>Create a New Account</h3>
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
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isRegistering}
              />
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                autoComplete="off"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isRegistering}
              />
            </div>
            {errorMessage && (
              <span className="error-message">{errorMessage}</span>
            )}
            {verificationSent && (
              <span className="verification-sent">
                Verification email has been sent. Please check your inbox.
              </span>
            )}
            <button
              type="submit"
              disabled={isRegistering}
              className={`button ${isRegistering ? "disabled" : ""}`}
            >
              <span>{isRegistering ? "Signing Up..." : "Sign Up"}</span>
            </button>
            <div className="text-sm text-center sign-in">
              Already have an account?{" "}
              <Link to={"/login"} className="font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Register;
