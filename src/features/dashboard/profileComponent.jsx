import React, { useRef, useEffect, useState } from "react";
import notificationIcon from "../../assets/images/notification-icon.svg";
import notificationMarkIcon from "../../assets/images/notification-mark.svg";
import settingsIcon from "../../assets/images/settings-icon.svg";
import userIcon from "../../assets/images/user-icon-avatar.png";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default function ProfileComponent({ profileFlag, setProfileFlag }) {
  const navigate = useNavigate();
  const profileRef = useRef();
  const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;
  const login = process.env.REACT_APP_BASE_URL;
  const [logoutTimer, setLogoutTimer] = useState(null); // Manage token expiration timer
  const [hasLoggedOut, setHasLoggedOut] = useState(false); // Prevent multiple logout calls

  // Close profile dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setProfileFlag(false);
    }
  };

  // Clear local storage and other related cleanup tasks
  const clearLocalStorageAndNavigate = () => {
    localStorage.clear(); // Clear local storage
    setHasLoggedOut(true); // Mark as logged out
    setProfileFlag(false); // Close the profile dropdown
    navigate(login); // Redirect to login page
  };

  // Decode JWT to check expiry and set timer
  const handleTokenExpiry = () => {
    const token = localStorage.getItem("JWTToken");
    if (!token) {
      console.log("either the token is reset or no token was found to decode and work with");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log("decoded token " + decoded);
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      console.log("exp time " + expiryTime + " (in milliseconds)")
      const currentTime = Date.now();
      console.log("current time " + currentTime)

      if (expiryTime > currentTime) {
        const timeLeft = expiryTime - currentTime;
        console.log("Token time left:", timeLeft);

        // Clear any previous timer before setting a new one
        if (logoutTimer) clearTimeout(logoutTimer);

        const timer = setTimeout(() => {
          clearLocalStorageAndNavigate(); // Logout by clearing data and redirecting to login page
        }, timeLeft);

        setLogoutTimer(timer); // Save the timer reference to clean up later
      } else {
        // Token expired, navigate to login
        clearLocalStorageAndNavigate();
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      // In case of error, also clear local storage and navigate to login
      clearLocalStorageAndNavigate();
    }
  };

  // Logout function (if you still want to have the manual logout)
  const logout = async () => {
    if (hasLoggedOut) return; // Prevent duplicate logout calls

    console.log("Logging out");
    try {
      const emailId = localStorage.getItem("Email");
      if (emailId) {
        const formData = new FormData();
        formData.append("EmailId", emailId);

        await axios.post(`${backend_baseURL}/users/logout`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearLocalStorageAndNavigate(); // Always clear local storage and navigate to login
    }
  };

  useEffect(() => {
    if (profileRef.current) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (logoutTimer) clearTimeout(logoutTimer); // Ensure timer is cleared
    };
  }, [profileRef, logoutTimer]);

  useEffect(() => {
    handleTokenExpiry(); // Check token expiry when the component mounts
  }, []);

  return (
    <div ref={profileRef} className="divcontents">
      <ul className="user-options">
       
        <li className="me-0 pos-rel">
          <img
            src={userIcon}
            alt="User Icon"
            role="button"
            onClick={() => setProfileFlag(true)}
          />
          {profileFlag === true && (
            <ul className="user-profile">
              <li>
                <button>Profile</button>
              </li>
              <li role="button" onClick={logout}>
                <button>Logout</button>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
