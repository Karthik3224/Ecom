import { Typography, Link, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import "./TermsAndConditons.css";

const TermsAndConditons = () => {
  return (
    <Box className="footer-wrapper">
      <Typography className="footer-agreement-text">
        By creating an account, you agree to our{" "}
        <Link
          component={RouterLink}
          to="/terms-conditions"
          className="policy-link"
          underline="none"
        >
          Terms & Conditions
        </Link>{" "}
        and{" "}
        <Link
          component={RouterLink}
          to="/privacy-policy"
          className="policy-link"
          underline="none"
        >
          Privacy Policy
        </Link>
      </Typography>
    </Box>
  );
};

export default TermsAndConditons;
