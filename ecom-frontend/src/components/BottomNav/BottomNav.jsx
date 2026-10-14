import { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { AppContext } from '../../context/AppContext';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, t } = useContext(AppContext);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <Box className="bottom-nav-container">
      <Box className={`nav-item ${isActive('/home')}`} onClick={() => navigate('/home')}>
        <HomeOutlinedIcon className="nav-icon" />
        <Typography className="nav-text">{t('home')}</Typography>
      </Box>
      <Box className={`nav-item ${isActive('/categories')}`} onClick={() => navigate('/categories')}>
        <GridViewOutlinedIcon className="nav-icon" />
        <Typography className="nav-text">{t('categories')}</Typography>
      </Box>
      {isLoggedIn && (
        <Box className={`nav-item ${isActive('/profile')}`} onClick={() => navigate('/profile')}>
          <PersonOutlineOutlinedIcon className="nav-icon" />
          <Typography className="nav-text">{t('profile')}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default BottomNav;
