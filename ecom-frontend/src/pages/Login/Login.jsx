import { useContext, useEffect, useState } from 'react';
import { Alert, Box, Button, IconButton, InputAdornment, Link, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import logo from '../../assets/images/logo.png';
import splashImage from '../../assets/images/splash-image.png';
import './Login.css';
import TermsAndConditons from '../../components/TermsAndConditions/TermsAndConditons';
import { AppContext } from '../../context/AppContext';
import { customerAuthService as auth } from '../../services/customerAuthService';
import { orgAccessService, teamLandingPath } from '../../services/orgAccessService';
import { customerProfileService } from '../../services/customerProfileService';
import { formatIndianMobile } from '../../utils/phoneValidation';
import { validRegistrationName, validRegistrationGmail } from '../../utils/registrationValidation';

const titles = { login: 'Sign in', register: 'Create Account', mobile: 'Sign in with Mobile OTP', emailOtp: 'Sign in with Email OTP', forgot: 'Forgot Password', verify: 'Verify your code', reset: 'Reset Password' };
export default function Login({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AppContext);
  const [mode, setMode] = useState(initialMode);
  const [fields, setFields] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '', code: '' });
  const [challenge, setChallenge] = useState(null);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(() => sessionStorage.getItem('signInNotice') || '');
  useEffect(() => { sessionStorage.removeItem('signInNotice'); }, []);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, []);
  const switchMode = (next) => { setMode(next); setError(''); setMessage(''); setShowPw(false); setFields(value => ({ ...value, password: '', confirmPassword: '', code: '' })); setResetToken(''); };
  const update = (key) => (event) => setFields(value => ({ ...value, [key]: event.target.value }));
  const finish = async (result) => {
    const previousToken = sessionStorage.getItem('authToken');
    sessionStorage.setItem('authToken', result.token);
    try {
      let tokenCustomerId = null;
      try {
        const payload = JSON.parse(atob(result.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        tokenCustomerId = payload.customerId || null;
      } catch { /* The profile request below will report an invalid token. */ }
      let profile = null;
      try { profile = await customerProfileService.me({ expireSession: false }); } catch (requestError) {
        if ([401, 403].includes(requestError.status)) throw new Error('Login was accepted, but Customer Profile rejected the session. Please retry; if it persists, the backend authentication configuration needs correction.', { cause: requestError });
        if (requestError.status !== 404) throw requestError;
      }
      login({ ...result.user, ...profile, id: tokenCustomerId || result.user.id, userId: result.user.userId, role: 'customer' }, result.token);
      const requested = location.state?.from;
      const returnTo = typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//') && !/^\/(admin|team-login|delivery|store-manager)/.test(requested) ? requested : '/home';
      navigate(returnTo, { replace: true, state: returnTo === '/address-form' ? location.state?.returnState : undefined });
    } catch (requestError) {
      if (previousToken) sessionStorage.setItem('authToken', previousToken); else sessionStorage.removeItem('authToken');
      throw requestError;
    }
  };
  const begin = (result, purpose, destination) => {
    setChallenge({ ...result, purpose, destination }); setSeconds(result.resendAfterSeconds); setMode('verify'); setShowPw(false);
    setFields(value => ({ ...value, password: '', confirmPassword: '', code: '' })); setMessage(result.message);
  };
  const passwordValid = () => {
    if (fields.password !== fields.confirmPassword) throw new Error('Passwords do not match.');
    if (new TextEncoder().encode(fields.password).length > 72 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(fields.password)) throw new Error('Use at least 8 characters with uppercase, lowercase and a number (maximum 72 bytes).');
  };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') {
        const identifier = fields.email.trim();
        let customerResult;
        const mobileIdentifier = /^[+\d\s()-]+$/.test(identifier);
        if (identifier.includes('@') || mobileIdentifier) {
          const destination = mobileIdentifier ? formatIndianMobile(identifier) : identifier;
          if (!destination) throw new Error('Enter a valid 10-digit Indian mobile number.');
          try { customerResult = await auth.login(destination, fields.password); }
          catch (loginError) { if (mobileIdentifier || loginError.status !== 401) throw loginError; }
        }
        if (customerResult) await finish(customerResult);
        else {
          const result = await orgAccessService.login(identifier, fields.password);
          if (!['store-manager', 'delivery-partner', 'global-admin', 'location-admin', 'super-admin'].includes(result.user?.role)) throw new Error('This account cannot access the staff dashboard.');
          login(result.user, result.token);
          navigate(teamLandingPath(result.user.role), { replace: true });
        }
      }
      if (mode === 'register') {
        if (!validRegistrationName(fields.name)) throw new Error('Enter your full name with at least three letters.');
        if (!validRegistrationGmail(fields.email)) throw new Error('Enter a valid Gmail address ending in @gmail.com.');
        passwordValid();
        const mobile = formatIndianMobile(fields.mobile);
        if (!mobile) throw new Error('Enter a valid 10-digit Indian mobile number.');
        setChallenge({ purpose: 'SIGNUP', destination: fields.email.trim() });
        setMode('verify'); setMessage('Sending your email verification code...');
        try { begin(await auth.register({ ...fields, mobile, email: fields.email.trim(), name: fields.name.trim() }), 'SIGNUP', fields.email.trim()); }
        catch (error) { setMode('register'); setMessage(''); setChallenge(null); throw error; }
      }
      if (mode === 'mobile' || mode === 'emailOtp' || mode === 'forgot') {
        const purpose = mode === 'mobile' ? 'MOBILE' : mode === 'emailOtp' ? 'EMAIL_LOGIN' : 'RESET';
        const destination = mode === 'mobile' ? formatIndianMobile(fields.mobile) : fields.email.trim();
        if (mode === 'mobile' && !destination) throw new Error('Enter a valid 10-digit Indian mobile number.');
        begin(await auth.send(destination, purpose), purpose, destination);
      }
      if (mode === 'verify') {
        const result = await auth.verify(challenge.challengeId, fields.code);
        if (challenge.purpose === 'MOBILE' || challenge.purpose === 'EMAIL_LOGIN') await finish(result);
        else if (challenge.purpose === 'RESET') { setResetToken(result.resetToken); setMode('reset'); }
        else { switchMode('login'); setMessage('Email verified. Log in with your email and password.'); }
      }
      if (mode === 'reset') { passwordValid(); await auth.reset({ challengeId: challenge.challengeId, resetToken, password: fields.password, confirmPassword: fields.confirmPassword }); switchMode('login'); setMessage('Password reset. Log in with your new password.'); }
    } catch (requestError) { setError(requestError.message || 'Unable to complete this request. Try again.'); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError('');
    try { begin(await auth.send(challenge.destination, challenge.purpose), challenge.purpose, challenge.destination); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const input = (key, label, type = 'text', extra = {}) => {
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPw ? 'text' : type;
    const passwordAdornment = isPassword ? {
      slotProps: {
        ...(extra.slotProps || {}),
        input: {
          ...(extra.slotProps?.input || {}),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(value => !value)} edge="end" tabIndex={-1}>
                {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      },
    } : {};
    return <TextField key={key} fullWidth required label={label} type={resolvedType} value={fields[key]} onChange={update(key)} disabled={busy} {...extra} {...passwordAdornment} />;
  };
  return <Box className="auth-shell">
    <Box className="auth-brand">
      <img src={logo} alt="Pickles & Spices" className="auth-brand-logo" />
      <Typography className="auth-brand-title">All your favorite pickles at one place</Typography>
      <img src={splashImage} alt="Pickles and spices" className="auth-brand-image" />
      <Button variant="contained" className="auth-brand-cta" onClick={() => navigate('/home')}>Explore Products</Button>
    </Box>
    <Box className="auth-panel">
      <Box className="login-header">
        <Button startIcon={<ArrowBackIcon />} className="header-btn back-btn" disabled={busy} onClick={() => mode === 'login' ? navigate('/home') : switchMode('login')}>Back</Button>
        <Button className="header-btn skip-btn" onClick={() => navigate('/home')}>Skip</Button>
      </Box>
      <Box className="login-box">
        <img src={logo} alt="Pickles & Spices" className="login-logo auth-panel-logo" />
        <Typography className="login-title" variant="h4">{titles[mode]}</Typography>
        <Box component="form" onSubmit={submit} className="login-form" sx={{ display: 'grid', gap: 2, mt: 3 }}>
          {mode === 'register' && input('name', 'Full Name', 'text', { autoComplete: 'name', slotProps: { htmlInput: { minLength: 3, maxLength: 120 } } })}
          {['login', 'register', 'forgot', 'emailOtp'].includes(mode) && input('email', mode === 'register' ? 'Gmail Address' : mode === 'login' ? 'Email, Mobile Number or Username' : 'Email', mode === 'login' ? 'text' : 'email', { autoComplete: mode === 'login' ? 'username' : 'email', slotProps: { htmlInput: { maxLength: 190 } } })}
          {['register', 'mobile'].includes(mode) && <TextField fullWidth required label="Mobile Number" type="tel" value={fields.mobile} onChange={(event) => {
            let value = event.target.value;
            if (/^(?:\+91|91)[\s()-]*[6-9][0-9\s()-]{9,}$/.test(value)) value = value.replace(/^\+?91[\s()-]*/, '').replace(/[\s()-]/g, '');
            setFields(previous => ({ ...previous, mobile: value }));
          }} disabled={busy} autoComplete="tel-national" slotProps={{ input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> }, htmlInput: { inputMode: 'numeric', pattern: '[6-9][0-9]{9}', maxLength: 10 } }} />}
          {['login', 'register', 'reset'].includes(mode) && input('password', mode === 'reset' ? 'New Password' : 'Password', 'password', { autoComplete: mode === 'login' ? 'current-password' : 'new-password', helperText: mode === 'login' ? '' : '8 or more characters, uppercase, lowercase and a number.' })}
          {['register', 'reset'].includes(mode) && input('confirmPassword', 'Confirm Password', 'password', { autoComplete: 'new-password' })}
          {mode === 'login' && <Box className="auth-forgot-row"><Link component="button" type="button" underline="hover" className="auth-link" onClick={() => switchMode('forgot')}>Forgot Password?</Link></Box>}
          {mode === 'verify' && <><Typography>{busy && !challenge.challengeId ? `Sending a verification code to ${challenge.destination}...` : `Enter the 6-digit code sent to ${challenge.destination}. It expires in 5 minutes.`}</Typography>{input('code', 'Verification Code', 'text', { autoComplete: 'one-time-code', slotProps: { htmlInput: { inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6 } } })}</>}
          {error && <Alert severity="error">{error}</Alert>}{message && <Alert severity={busy ? "info" : "success"}>{message}</Alert>}
          <Button type="submit" variant="contained" className="submit-btn" disabled={busy}>{busy ? 'Please wait...' : ({ login: 'Sign in', register: 'Create Account', mobile: 'Send OTP', emailOtp: 'Send OTP', forgot: 'Send OTP', verify: 'Verify OTP', reset: 'Reset Password' })[mode]}</Button>
          {mode === 'verify' && <Button disabled={busy || seconds > 0} onClick={resend}>{seconds > 0 ? `Resend in ${seconds}s` : 'Resend OTP'}</Button>}
          {mode === 'login' && <>
            <Box className="auth-divider"><span>OR</span></Box>
            <Button className="auth-alt-btn" disabled={busy} onClick={() => switchMode('mobile')}>Sign in with Mobile OTP</Button>
            <Button className="auth-alt-btn" disabled={busy} onClick={() => switchMode('emailOtp')}>Sign in with Email OTP</Button>
            <Typography className="auth-switch-text">Don&apos;t have an account? <Link component="button" type="button" underline="hover" className="auth-link" onClick={() => switchMode('register')}>Create Account</Link></Typography>
          </>}
          {mode !== 'login' && <Button disabled={busy} onClick={() => switchMode('login')}>Back to Login</Button>}
          <TermsAndConditons />
        </Box>
      </Box>
    </Box>
  </Box>;
}
