import React, { useState } from "react";
import "./App.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="page">
      <div className="content">

        <div className="auth-box">
          <h2>{isLogin ? "Login" : "Sign Up"}</h2>

          {!isLogin && (
            <input type="text" placeholder="Full Name" />
          )}

          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />

          <button>
            {isLogin ? "Login" : "Create Account"}
          </button>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? " Sign Up" : " Login"}
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Auth;