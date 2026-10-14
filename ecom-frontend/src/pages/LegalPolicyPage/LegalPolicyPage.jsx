import { Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import './LegalPolicyPage.css';

const LegalPolicyPage = ({ title }) => {
  const navigate = useNavigate();
  const pageTitle = title || 'Privacy Policy & Terms';

  return (
    <Box className="legal-page-wrapper">

      <Box className="legal-page-header">
        <IconButton aria-label="Back" onClick={() => navigate(-1)} style={{ color: '#1e293b' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" className="legal-header-title">
          {pageTitle}
        </Typography>
      </Box>

      <Box className="legal-page-scroll">
        <Box className="legal-content-card">
          <Typography className="legal-section-heading">1. Introduction</Typography>
          <Typography className="legal-text-body">
            Welcome to Pickles &amp; Spices. We respect your privacy and are committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information when you use our mobile and web application.
          </Typography>

          <Typography className="legal-section-heading">2. Information Collection</Typography>
          <Typography className="legal-text-body">
            We collect personal details such as your name, mobile number, delivery address, and email when you place an order or register an account.
          </Typography>

          <Typography className="legal-section-heading">3. Use of Information</Typography>
          <Typography className="legal-text-body">
            Your data is used strictly for processing orders, managing deliveries, sending order status updates, and improving customer service.
          </Typography>

          <Typography className="legal-section-heading">4. Terms of Service</Typography>
          <Typography className="legal-text-body">
            By accessing our service, you agree to comply with all applicable local laws and regulations regarding online purchases and home delivery.
          </Typography>
        </Box>
      </Box>

    </Box>
  );
};

export default LegalPolicyPage;
