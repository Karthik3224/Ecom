import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const SmsDisclaimer = () => {
  return (
    <Box className="message-wrapper">
      <Box className="form-disclaimer-above-button">
        <Typography className="disclaimer-text">
          By entering your mobile number, you agree to receive automated messages
          from us. Review our{" "}
          <Link
            href="#"
            className="disclaimer-link"
            style={{ fontWeight: 700 }}
            underline="none"
          >
            SMS Terms of Service
          </Link>
          . Standard messaging and data rates may apply.
        </Typography>
      </Box>
    </Box>
  );
};

export default SmsDisclaimer;