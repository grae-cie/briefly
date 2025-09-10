import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { FaFacebookF } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";


function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const storedUsers = JSON.parse(localStorage.getItem("brieflyUsers")) || [];
    const cleanUsername = username.trim().toLowerCase();
    if (isSignUp) {
      if (password.length < 6) {
        alert("Password must be at least 6 characters ❌");
        return;
      }
      const existingUser = storedUsers.find(
        (u) => u.username === cleanUsername
      );
      if (existingUser) {
        alert("This username already exists. Please input another username.");
        // setIsSignUp(true); 
        setUserName("");
        setPassword("");
        return;
      }

      const newUser = { username: cleanUsername, password };
      storedUsers.push(newUser);
      localStorage.setItem("brieflyUsers", JSON.stringify(storedUsers));
      localStorage.setItem("currentUser", JSON.stringify(cleanUsername));
      onLogin(cleanUsername);
      setUserName("");
      setPassword("");
    } else {
      const existingUser = storedUsers.find(
        (u) => u.username === cleanUsername && u.password === password
      );

      if (!existingUser) {
        alert("Invalid username or password ❌");
        setUserName("");
        setPassword("");
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(cleanUsername));
      onLogin(cleanUsername);
      setUserName("");
      setPassword("");
    }
  };

  return (
    <div className="container-div">
      <div className="container-body">
        <div className="side-pane-container">
          <h1>
            Welcome To <span>Briefly</span>{" "}
          </h1>
          <p>
            Briefly is a simple and smart note summarizer app that helps you cut
            through the noise. Whether it’s class notes, articles, or long text,
            Briefly turns it into clear, concise summaries you can understand at
            a glance. It’s designed to save you time, keep you focused, and make
            studying or reading easier.
          </p>
        </div>
        <section className="sign-in-container">
          <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">User Name:</label>
          
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              placeholder="Enter Your Username"
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <br />
            <label htmlFor="password">Password:</label>

            <input
              type="password"
              placeholder="Must be at least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <br />

            <button className="sign-up-btn" type="submit">
              {isSignUp ? "Sign Up" : "Login"}{" "}
            </button>

            <p className="have-an-account" >
              {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
              <button className="log-in-btn" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? "Login" : "Sign Up"}
              </button>
            </p>
          </form>

          {/* 👇 Switch between modes */}

          <div className="icons">
            <FaFacebookF />
            <FaInstagram />
            <FaXTwitter />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
