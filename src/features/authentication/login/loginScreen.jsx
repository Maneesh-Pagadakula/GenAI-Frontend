// import "../../../common-components/globalStyles.css";
import "../../../styles/main.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useFormik } from "formik";
import { LoginSchema } from "./loginForm";
import loginLeftIcon from "../../../assets/images/login-left-img.png";
import companyLogo from "../../../assets/images/Evoke_technologies_logo-new-cropped-b&w.svg";
import eyeIcon from "../../../assets/images/eye-icon-open.svg";
// import successIconTick from '../../assets/images/green-tick-icon.svg';
import successIcon from "../../../assets/images/success-close.svg";
// import landingScreen from '../../assets/images/landing-screen-icon.svg';
import tosterCheckIcon from "../../../assets/images/toaster-check-icon.svg";

function LoginScreen() {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const dashboard = process.env.REACT_APP_DASHBOARD;
  const forgotPassword = process.env.REACT_APP_FORGOT_PASSWORD;
  const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { resetForm }) => {
      // console.log(values);
      await handleLogin(values);
      // const isAuthenticated = true
      // localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
      // navigate('/dashboard');
      setTimeout(() => {
        resetForm();
      }, 1000);
    },
  });

  const handleLogin = async (values) => {
    // e.preventDefault();
    setError("");

    try {
      const response = await axios.post(backend_baseURL + "/users/login", {
        email: values.email,
        password: values.password,
      });
      localStorage.setItem("Email", values.email);
      localStorage.setItem("JWTToken", response.data.token);
      console.log(response, "response");
      if (response.status === 200) {
        setLoginData(response);
        const loginFlag = response.status === 200 ? true : false;
        localStorage.setItem("isAuthenticated", JSON.stringify(loginFlag));
        setTimeout(() => {
          navigate(dashboard);
        }, 1000);
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || "Login failed");
      } else if (error.request) {
        setError("No response from the server. Please try again later.");
      } else {
        setError("An error occurred. Please try again later.");
      }
    }
  };
  console.log(formik, loginData);
  return (
    <>
      <div className="container-fluid p-0">
        <div className="row m-0">
          <div className="col-md-6 p-0">
            <div className="login-left pos-rel">
              <img
                className="login-left-banner-img"
                src={loginLeftIcon}
                alt="Login Banner"
              />
              <div className="login-logo">
                <img src={companyLogo} alt="Company Logo" />
              </div>
              <div className="login-banner-content">
                <h2 className="login-banner-head">QA Accelerator</h2>
                <h5>
                  <i>AI Meets QA - Faster, Smarter, Better</i>
                </h5>
                <p className="login-banner-desc">
                  <i>
                    Supercharge your testing with seamless automation. Deliver
                    faster, smarter and effortlessly with QA Accelerator!
                  </i>
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6 p-0 pos-rel">
            <div className="card login-card">
              <div className="login-form">
                <h3>Welcome back!</h3>
                <p>Please login to your account.</p>
                {/* Show error message right under the "Please login" text */}
                {error && (
                  <div className="error-message alert alert-danger">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                {/* <form onSubmit={formik.handleSubmit} className="validation-fields"> */}
                <form onSubmit={formik.handleSubmit}>
                  <div className="form-group">
                    <label for="email">Email or Username</label>
                    <input
                      className={
                        formik.touched.email && formik.errors.email
                          ? "validation-fields form-control"
                          : "form-control"
                      }
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      autoComplete="Email"
                    />
                    {formik.touched.email && formik.errors.email ? (
                      <div className="error">{formik.errors.email}</div>
                    ) : null}
                  </div>
                  <div className="form-group pos-rel">
                    <label for="email">Password</label>
                    <input
                      className={
                        formik.touched.password && formik.errors.password
                          ? "validation-fields form-control"
                          : "form-control"
                      }
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      autoComplete="password"
                    />
                    <span
                      className={`eye-icon ${
                        showPassword ? "eye-icon-slash" : ""
                      }`}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <img src={eyeIcon} alt="Toggle Password Visibility" />
                    </span>
                    {formik.touched.password && formik.errors.password ? (
                      <div className="error validation-fields">
                        {formik.errors.password}
                      </div>
                    ) : null}
                  </div>
                  <div className="d-flex justify-content-between form-group">
                    <div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value=""
                          id="flexCheckDefault"
                        />
                        <label
                          className="form-check-label"
                          htmlFor="flexCheckDefault"
                        >
                          Remember me
                        </label>
                      </div>
                    </div>
                    <div
                      className="cred-link"
                      role="button"
                      onClick={() => navigate(forgotPassword)}
                    >
                      Forgot Password
                    </div>
                  </div>
                  <div className="form-group">
                    <button className="btn btn-primary w-100" type="submit">
                      Login
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {loginData.status === 200 && (
          <div className="alert alert-primary cust-toster" role="alert">
            <img src={tosterCheckIcon} alt="Toster check" />
            <span className="vert-mdle"> {loginData.data.message}</span>
            <img
              className="close-icon-green"
              src={successIcon}
              alt=" Success Icon"
            />
          </div>
        )}
      </div>
    </>
  );
}
export default LoginScreen;
