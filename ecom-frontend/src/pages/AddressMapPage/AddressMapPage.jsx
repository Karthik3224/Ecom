import { useContext, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircle';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import GoogleLocationPicker from '../../components/GoogleLocationPicker/GoogleLocationPicker';
import './AddressMapPage.css';

export default function AddressMapPage() {
  const navigate = useNavigate();
  const route = useLocation();
  const { selectedLocation, saveSelectedLocation } = useContext(AppContext);
  const [selection, setSelection] = useState(route.state?.location || selectedLocation || null);
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const returnTo = route.state?.returnTo || '/home';
  const confirm = (place) => { saveSelectedLocation(place); setConfirmedLocation(place); };
  const continueToAddress = () => navigate(returnTo, { replace: true, state: { ...route.state?.formState, startManual: false, location: confirmedLocation } });
  const goBack = () => navigate(returnTo, { replace: true, state: route.state?.formState });

return <Box className="map-page-wrapper"><Box className="map-page-header"><IconButton onClick={goBack} sx={{ color: '#fff' }}><ArrowBackIcon /></IconButton><Typography variant="h6" className="map-header-title">Select delivery location</Typography></Box><Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: { xs: 1.5, sm: 2.5 }, bgcolor: '#f4f7f6' }}><Box sx={{ maxWidth: 1100, mx: 'auto', bgcolor: '#fff', p: { xs: 1.5, sm: 2 }, borderRadius: 3, boxShadow: '0 8px 30px rgba(15,23,42,.08)' }}><GoogleLocationPicker value={selection} onChange={setSelection} autoLocate={!selection} autoFocusSearch={Boolean(route.state?.autoFocusSearch)} onConfirm={confirm} confirmLabel="Confirm Location" /></Box></Box><Dialog open={Boolean(confirmedLocation)} onClose={continueToAddress} aria-labelledby="location-confirmed-title" fullWidth maxWidth="xs"><DialogTitle id="location-confirmed-title" sx={{display:'flex',alignItems:'center',gap:1,color:'#075f40'}}><CheckCircleOutlineIcon />Location confirmed</DialogTitle><DialogContent><Typography>{confirmedLocation?.address || confirmedLocation?.subtitle || confirmedLocation?.title}</Typography></DialogContent><DialogActions><Button autoFocus variant="contained" onClick={continueToAddress} sx={{bgcolor:'#075f40'}}>Continue</Button></DialogActions></Dialog></Box>;
}
