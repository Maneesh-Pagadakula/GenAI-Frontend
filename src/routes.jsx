import React, { useEffect, useState } from "react";
import { useNavigate, useRoutes, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import LandingPage from "./features/dashboard/landingPage";
import LoginScreen from "./features/authentication/login/loginScreen";
import ForgotPassword from "./features/authentication/login/forgotPassword/forgotPassword";
import { DevOpsTokenService } from "./utils/devopsTokenService";
import { JiraTokenService } from "./features/dashboard/jira-token-data"; // Add this import

const baseURL = process.env.REACT_APP_BASE_URL;
const dashboard = process.env.REACT_APP_DASHBOARD;
const forgotPassword = process.env.REACT_APP_FORGOT_PASSWORD;
const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;

console.log(baseURL);
console.log(dashboard);
console.log(forgotPassword);
console.log(backend_baseURL);

const Routes = [
  //   { path: '/', element: <UserScreenIndex/> },
  { path: baseURL, element: <LoginScreen /> },
  { path: forgotPassword, element: <ForgotPassword /> },
];

const PrivateRoutes = [
  //   { path: '/dashboard', element: <DashboardIndex /> },
  //   { path: '/execute', element: <Dashboard/> },
  { path: dashboard + `/*`, element: <LandingPage /> },
];

export default function Router() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showJiraPopup, setShowJiraPopup] = useState(false);
  const [showDevOpsPopup, setShowDevOpsPopup] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const email = localStorage.getItem("Email");
    const urlParams = new URLSearchParams(location.search);
    const authCode = urlParams.get("code");
    const authType = localStorage.getItem("authType");

    // Check if we already have valid tokens before processing auth code
    const hasValidJiraToken =
      JiraTokenService.hasValidToken() || JiraTokenService.isAuthenticated();
    const hasValidDevOpsToken = DevOpsTokenService.hasValidToken();

    console.log("Auth status check:", {
      authCode,
      authType,
      hasValidJiraToken,
      hasValidDevOpsToken,
      isAuthenticated,
    });

    const handleAuthCallback = async () => {
      try {
        console.log("Processing Jira auth callback for email:", email);
        const response = await axios.get(
          backend_baseURL +
            `/jira-oauth/callback?EmailId=${email}&code=${authCode}`,
          { withCredentials: true }
        );
        console.log("Jira response data:", response.data);

        if (response.status === 200 && response.data) {
          if (response.data.access_token) {
            localStorage.setItem("accessToken", response.data.access_token);
            const success = JiraTokenService.storeToken(response.data);
            if (success) {
              console.log("Jira token stored successfully");
              setShowJiraPopup(true);
            } else {
              console.error("Failed to store Jira token");
            }
          } else if (response.data.message === "Authorization successful!") {
            console.log("Jira authentication successful - storing session");

            const mockTokenData = {
              access_token: "jira_session_active",
              expires_in: 3600,
              auth_message: response.data.message,
            };

            const success = JiraTokenService.storeToken(mockTokenData);
            if (success) {
              console.log("Jira session stored successfully");
              setShowJiraPopup(true);
            } else {
              console.error("Failed to store Jira session");
              setShowJiraPopup(true);
            }
          }
        }

        // Clear the auth code from URL after processing
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        localStorage.removeItem("authType");
      } catch (error) {
        console.error("Error during Jira authorization callback:", error);
        localStorage.removeItem("authType");
      }
    };

    const handleDevOpsAuthCallback = async () => {
      try {
        console.log("Processing DevOps auth callback for email:", email);
        const response = await axios.get(
          backend_baseURL + `/azure-devops-oauth/callback?&code=${authCode}`,
          { withCredentials: true }
        );
        console.log("DevOps response data:", response.data);

        if (response.status === 200 && response.data) {
          localStorage.setItem("accessToken", response.data.access_token);
          const success = DevOpsTokenService.storeToken(response.data);
          if (success) {
            console.log("DevOps token stored successfully");
            setShowDevOpsPopup(true);
          } else {
            console.error("Failed to store DevOps token");
          }
        } else {
          console.error("Invalid response from DevOps OAuth callback");
        }

        // Clear the auth code from URL after processing
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        localStorage.removeItem("authType");
      } catch (error) {
        console.error("Error during DevOps authorization callback:", error);
        localStorage.removeItem("authType");
      }
    };

    // Main authentication logic
    if (authCode && !isAuthenticated) {
      console.log("Processing OAuth callback with authType:", authType);

      // Check if we should process this auth code based on service and existing tokens
      let shouldProcess = false;
      let callbackHandler = null;

      if (authType === "jira") {
        shouldProcess = !hasValidJiraToken;
        callbackHandler = handleAuthCallback;
        console.log("Jira auth requested, shouldProcess:", shouldProcess);
      } else if (authType === "devops") {
        shouldProcess = !hasValidDevOpsToken;
        callbackHandler = handleDevOpsAuthCallback;
        console.log("DevOps auth requested, shouldProcess:", shouldProcess);
      } else {
        // Default to Jira if no authType specified
        shouldProcess = !hasValidJiraToken;
        callbackHandler = handleAuthCallback;
        console.log("Default (Jira) auth, shouldProcess:", shouldProcess);
      }

      if (shouldProcess && callbackHandler) {
        console.log(`Processing ${authType || "default"} OAuth callback`);

        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("authCode", authCode);
        setIsAuthenticated(true);
        navigate(dashboard);

        // Execute the appropriate callback
        callbackHandler();
      } else {
        console.log(
          "Already have valid tokens or no handler, skipping OAuth callback"
        );
        // Clear the auth code from URL since we don't need to process it
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        localStorage.removeItem("authType");

        // Set authenticated status and navigate
        localStorage.setItem("isAuthenticated", "true");
        setIsAuthenticated(true);
        navigate(dashboard);
      }
    } else if (authStatus === "true") {
      setIsAuthenticated(true);
      navigate(dashboard);
    } else {
      setIsAuthenticated(false);
    }
  }, [navigate, isAuthenticated, location.search, backend_baseURL]);
  useEffect(() => {
    if (isAuthenticated === false && location.pathname === dashboard) {
      navigate(baseURL);
    }
  }, [isAuthenticated, location.pathname, dashboard, navigate, baseURL]);

  return useRoutes([
    {
      path: baseURL,
      element: <Outlet />,
      children: isAuthenticated
        ? PrivateRoutes.map((route) => ({
            ...route,
            element: React.cloneElement(route.element, {
              showJiraPopup,
              setShowJiraPopup,
              showDevOpsPopup,
              setShowDevOpsPopup,
            }),
          }))
        : Routes,
    },
  ]);
}
