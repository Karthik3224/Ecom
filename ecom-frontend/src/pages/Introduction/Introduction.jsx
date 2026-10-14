import { Box, Button, Link, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import logo from "../../assets/images/logo.png";
import splashImage from "../../assets/images/splash-image.png";

import "./Introduction.css";

const Introduction = () => {
  const navigate = useNavigate();

  return (
    <Box className="intro-wrapper">
      <Box className="intro-page">

        <Box className="intro-left">

          <img
            src={logo}
            alt="Pickles & Spices"
            className="intro-logo"
          />

          <Typography className="intro-title">
            All your favorite
            <br />
            pickles at one place
          </Typography>

          <Button
            variant="contained"
            className="explore-btn"
            onClick={() => navigate("/home")}
          >
            Explore Products
          </Button>

          <Button
            variant="outlined"
            className="login-btn"
            onClick={() => navigate("/login")}
          >
            Log In
          </Button>

          <Typography className="register-text">
            or{" "}
            <Link
              underline="none"
              className="register-link"
              onClick={() => navigate("/register")}
            >
              Create Account
            </Link>
          </Typography>

        </Box>

        <Box className="intro-right">

          <img
            src={splashImage}
            alt="Pickles"
            className="splash-image"
          />

        </Box>
      </Box>
    </Box>
  );
};

export default Introduction;
