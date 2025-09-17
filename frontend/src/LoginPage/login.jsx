import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./login.css";
import { FaFacebookF } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";

// ✅ Yup validation schema
const validationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle form submission
  const handleSubmit = (values, { resetForm }) => {
    const { username, password } = values;
    const storedUsers = JSON.parse(localStorage.getItem("brieflyUsers")) || [];
    const cleanUsername = username.trim().toLowerCase();

    if (isSignUp) {
      const existingUser = storedUsers.find(
        (u) => u.username === cleanUsername
      );
      if (existingUser) {
        alert("This username already exists ❌");
        resetForm();
        return;
      }
      const newUser = { username: cleanUsername, password };
      storedUsers.push(newUser);
      localStorage.setItem("brieflyUsers", JSON.stringify(storedUsers));
      localStorage.setItem("currentUser", JSON.stringify(cleanUsername));
      onLogin(cleanUsername);
    } else {
      const existingUser = storedUsers.find(
        (u) => u.username === cleanUsername && u.password === password
      );
      if (!existingUser) {
        alert("Invalid username or password ❌");
        resetForm();
        return;
      }
      localStorage.setItem("currentUser", JSON.stringify(cleanUsername));
      onLogin(cleanUsername);
    }

    resetForm();
  };

  return (
    <div className="container-div">
      <div className="container-body">
        <div className="side-pane-container">
          <h1>
            Welcome To <span>Briefly</span>
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

          {/* ✅ Formik form */}
          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form>
                <label htmlFor="username">User Name:</label>
                <Field
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter Your Username"
                />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="error"
                />

                <label htmlFor="password">Password:</label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Must be at least 6 characters"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="error"
                />

                <button className="sign-up-btn" type="submit">
                  {isSignUp ? "Sign Up" : "Login"}
                </button>

                <p className="have-an-account">
                  {isSignUp
                    ? "Already have an account?"
                    : "Don’t have an account?"}{" "}
                  <button
                    className="log-in-btn"
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? "Login" : "Sign Up"}
                  </button>
                </p>
              </Form>
            )}
          </Formik>

          {/* 👇 Social icons */}
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
