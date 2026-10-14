import { useState, useContext } from 'react';
import { Box, Typography, Button, IconButton, InputBase } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav/BottomNav';
import { customerProfileService } from '../../services/customerProfileService';
import './DeleteAccountPage.css';

const DeleteAccountPage = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AppContext);

  const [step, setStep] = useState('EMAIL'); // EMAIL or OTP
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleContinue = () => {
    if (!emailInput) {
      alert('Please enter your email address');
      return;
    }
    setStep('OTP');
  };

  const handleDeleteAccount = async () => {
    if (otpInput !== '1234') {
      setFeedback('Enter the demo deletion OTP: 1234');
      return;
    }
    try {
      await customerProfileService.remove();
      logout();
      navigate('/intro');
    } catch (error) {
      setFeedback(error.message);
    }
  };

  return (
    <Box className="delete-page-wrapper">
      {/* Top Header Bar */}
      <Box className="delete-page-header">
        <IconButton onClick={() => (step === 'OTP' ? setStep('EMAIL') : navigate('/profile'))} style={{ color: '#ffffff' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" className="delete-header-title">
          Delete Account
        </Typography>
      </Box>

      {/* Content */}
      <Box className="delete-page-content">
        {feedback && <Typography role="alert" sx={{ color: '#b91c1c', mb: 2 }}>{feedback}</Typography>}
        <Typography className="delete-question-title">
          Are you sure you want to delete your account?
        </Typography>

        <Typography className="delete-warning-text">
          Once your deletion request is registered, you will no longer be able to use your account. You will be logged out of all devices you'll lose all saved information like your order history addresses.
        </Typography>

        {step === 'EMAIL' ? (
          /* Step 1: Confirm Email Address */
          <Box className="delete-form-step">
            <Typography className="field-heading-label">Confirm email address</Typography>
            <InputBase
              placeholder="Enter email id"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="delete-input-underline"
            />
            <Typography className="field-hint-text">
              Please confirm your email address. We'll send the confirmation of deletion of your account to your email, once completed.
            </Typography>
          </Box>
        ) : (
          /* Step 2: Enter OTP */
          <Box className="delete-form-step">
            <Box className="otp-header-row">
              <Typography className="field-heading-label">Enter OTP</Typography>
              <Typography className="resend-otp-link">Resend OTP</Typography>
            </Box>

            <InputBase
              placeholder="Enter OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="delete-input-underline"
            />

            <Typography className="field-hint-text">
              This action cannot be undone. If you wish to delete your account please enter the OTP
              {' '}Demo OTP: 1234.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer Sticky Button */}
      <Box className="delete-page-footer">
        {step === 'EMAIL' ? (
          <Button
            variant="contained"
            fullWidth
            className="continue-gray-btn"
            onClick={handleContinue}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            className="delete-red-btn"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
};

export default DeleteAccountPage;
