import { Box, Typography } from '@mui/material';
import logo from '../../assets/images/logo.png';
import './BrandLoader.css';

const sizes = { small:38,medium:58,large:82 };
const BrandLoader = ({ size='medium',fullScreen=false,label='Loading...' }) => <Box className={`brand-loader ${fullScreen?'brand-loader-full':''}`} role="status" aria-live="polite"><img src={logo} alt="" style={{width:sizes[size] || sizes.medium,height:sizes[size] || sizes.medium}}/><Typography>{label}</Typography></Box>;
export default BrandLoader;
