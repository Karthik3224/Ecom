import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const StatusPage = ({ title, message }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
        <Typography sx={{ color: '#64748b', mb: 3 }}>{message}</Typography>
        <Button variant="contained" onClick={() => navigate('/home')}>Back to Home</Button>
      </Box>
    </Box>
  );
};

export default StatusPage;
