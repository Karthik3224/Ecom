import { Navigate } from 'react-router-dom';
// Old bookmarks must start a fresh, server-issued verification challenge.
export default function OTPVerification() { return <Navigate to="/login" replace />; }
