

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./login.css";
import { FaFacebookF } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";

const BACKEND_URL = "http://localhost:5000"; // your backend

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

  const handleSubmit = async (values, { resetForm }) => {
    const { username, password } = values;

    try {
      const endpoint = isSignUp ? "/auth/register" : "/auth/login";

      const res = await fetch(BACKEND_URL + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      // Save JWT token and username
      if (data.token) localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", data.username || username);

      onLogin(data.username || username);
      navigate("/dashboard"); // redirect after login

      resetForm();
    } catch (err) {
      console.error(err);
      alert("Network error, please try again.");
    }
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

          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form>
                <label htmlFor="username">Username:</label>
                <Field
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                />
                <ErrorMessage name="username" component="div" className="error" />

                <label htmlFor="password">Password:</label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Must be at least 6 characters"
                />
                <ErrorMessage name="password" component="div" className="error" />

                <button className="sign-up-btn" type="submit">
                  {isSignUp ? "Sign Up" : "Login"}
                </button>

                <p className="have-an-account">
                  {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
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


