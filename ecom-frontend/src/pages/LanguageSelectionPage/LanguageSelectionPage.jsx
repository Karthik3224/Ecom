import { resources, translate } from '../../i18n/index';
import { useContext, useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LanguageIcon from '@mui/icons-material/Language';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { profileStore } from '../../services/localDataService';
import logo from '../../assets/images/logo.png';
import './LanguageSelectionPage.css';

const languages = Object.keys(resources).map((value) => ({ value, native: resources[value].native, sample: resources[value].sample }));

const LanguageSelectionPage = () => {
  const navigate = useNavigate();
  const route = useLocation();
  const { locale, updateLocale, user, setUser } = useContext(AppContext);
  const [language, setLanguage] = useState(locale.language);
  const [currency, setCurrency] = useState(locale.currency);
  const [timeZone, setTimeZone] = useState(locale.timeZone);
  const [saving, setSaving] = useState(false);
  const onboarding = Boolean(route.state?.onboarding);
  const labels = resources[language] || resources.English;

  const save = async () => {
    setSaving(true);
    const nextLocale = { language, currency, timeZone };
    updateLocale(nextLocale);
    try {
      if (user) {
        const saved = await profileStore.update({ locale: nextLocale, localeConfigured: true });
        setUser(saved);
      }
      navigate(onboarding ? '/profile' : (route.state?.returnTo || '/home'), onboarding ? { replace: true, state: { completeProfile: true, returnTo: route.state?.returnTo || '/home' } } : { replace: true });
    } finally { setSaving(false); }
  };

  return <Box className="language-page">
    <Box className="language-topbar"><Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>{translate(language, 'back')}</Button><img src={logo} alt="Pickles & Spices" /><Box aria-hidden="true" /></Box>
    <Box className="language-panel">
      <Box className="language-title-icon"><LanguageIcon /></Box>
      <Typography component="h1">{labels.title}</Typography>
      <Typography className="language-subtitle">{labels.subtitle}</Typography>
      <Box className="language-options">
        {languages.map((item) => <button type="button" key={item.value} className={`language-option ${language === item.value ? 'selected' : ''}`} onClick={() => { setLanguage(item.value); updateLocale({ language: item.value }); }}><Box><strong>{item.native}</strong><span>{item.sample}</span></Box>{language === item.value && <CheckCircleIcon />}</button>)}
      </Box>
      <Box className="regional-settings">
        <FormControl fullWidth><InputLabel>{labels.currency}</InputLabel><Select label={labels.currency} value={currency} onChange={(event) => setCurrency(event.target.value)}><MenuItem value="INR">INR - Indian Rupee</MenuItem><MenuItem value="USD">USD - US Dollar</MenuItem><MenuItem value="AED">AED - UAE Dirham</MenuItem><MenuItem value="GBP">GBP - British Pound</MenuItem></Select></FormControl>
        <FormControl fullWidth><InputLabel>{labels.timezone}</InputLabel><Select label={labels.timezone} value={timeZone} onChange={(event) => setTimeZone(event.target.value)}><MenuItem value="Asia/Kolkata">India - Asia/Kolkata</MenuItem><MenuItem value="Asia/Dubai">UAE - Asia/Dubai</MenuItem><MenuItem value="Europe/London">UK - Europe/London</MenuItem><MenuItem value="America/New_York">USA - America/New_York</MenuItem><MenuItem value="UTC">UTC</MenuItem></Select></FormControl>
      </Box>
      <Button className="language-continue" variant="contained" onClick={save} disabled={saving}>{saving ? translate(language, 'saving') : onboarding ? labels.continue : labels.save}</Button>
    </Box>
  </Box>;
};

export default LanguageSelectionPage;
