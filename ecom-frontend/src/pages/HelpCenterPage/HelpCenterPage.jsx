import { useState } from 'react';
import { Box, Typography, Button, IconButton, Accordion, AccordionSummary, AccordionDetails, TextField } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import './HelpCenterPage.css';
import { supportStore } from '../../services/localDataService';

const HelpCenterPage = () => {
  const navigate = useNavigate();
  const [ticketText, setTicketText] = useState('');
  const [chatText, setChatText] = useState('');
  const [tickets, setTickets] = useState(() => supportStore.tickets());
  const [messages, setMessages] = useState(() => supportStore.messages());

  const faqs = [
    {
      q: 'How long does delivery take',
      a: 'We usually deliver your order within 24-48 hours depending on your location. Delivery timelines may vary during peak seasons and holidays.',
    },
    {
      q: 'How to store Pickles',
      a: 'Store in a cool, dry place. Always use a dry spoon to preserve freshness and avoid moisture contamination.',
    },
    {
      q: 'What payment Methods Do you accept',
      a: 'We accept UPI (GPay, PhonePe, Paytm), Credit & Debit Cards, Net Banking, and major Digital Wallets.',
    },
    {
      q: 'Can i cancel my Order',
      a: 'Orders can be cancelled before dispatch directly from the Order Details section or by contacting customer support.',
    },
    {
      q: 'Are Your Pickles Are Homemade',
      a: 'Yes, all our pickles are 100% homemade using traditional recipes and cold-pressed oils without artificial preservatives.',
    },
    {
      q: 'Do you take Orders From national Wide',
      a: 'Yes! We ship across India with fast courier partners to deliver fresh homemade products to your doorstep.',
    },
  ];

  return (
    <Box className="help-page-wrapper">
      <Header />

      {/* Header Bar matching screenshot */}
      <Box className="help-page-header">
        <IconButton onClick={() => navigate('/profile')} style={{ color: '#1e293b' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" className="help-header-title">
          Help center
        </Typography>
      </Box>

      <Box className="help-page-scroll">
        {/* Support Banner & Illustration */}
        <Box className="help-hero-banner">
          <Box className="help-hero-text-col">
            <Typography className="help-intro-desc">
              Have questions about your order, delivery, payments, or our products? Our customer support team is happy to assist you.
            </Typography>
          </Box>
          <Box className="support-agent-img-wrap">
            <span className="agent-emoji">ðŸŽ§ðŸ‘©â€ðŸ’¼</span>
          </Box>
        </Box>

        {/* Action Buttons: Call US & Email US */}
        <Box className="help-action-btns-row">
          <Button variant="outlined" className="call-us-btn" onClick={() => window.open('tel:1800123456')}>
            Call US
          </Button>
          <Button variant="contained" className="email-us-btn" onClick={() => window.open('mailto:support@picklesandspices.com')}>
            Email US
          </Button>
          <Button variant="outlined" onClick={() => window.open('https://wa.me/911800123456', '_blank', 'noopener,noreferrer')}>WhatsApp</Button>
        </Box>

        <Box className="faq-container-card">
          <Typography className="faq-main-heading">Raise a Support Ticket</Typography>
          <TextField fullWidth multiline minRows={2} label="Describe your issue" value={ticketText} onChange={(e) => setTicketText(e.target.value)} />
          <Button variant="contained" sx={{ mt: 2 }} disabled={ticketText.trim().length < 5} onClick={() => { supportStore.createTicket({ subject: ticketText }); setTickets(supportStore.tickets()); setTicketText(''); }}>Submit Ticket</Button>
          {tickets.map((ticket) => <Typography key={ticket.id} sx={{ mt: 1 }}>{ticket.id} — {ticket.status}: {ticket.subject}</Typography>)}
        </Box>

        <Box className="faq-container-card">
          <Typography className="faq-main-heading">Live Chat</Typography>
          <Box sx={{ maxHeight: 180, overflowY: 'auto', mb: 2 }}>{messages.map((item) => <Typography key={item.id} sx={{ textAlign: item.sender === 'customer' ? 'right' : 'left' }}>{item.text}</Typography>)}</Box>
          <TextField fullWidth label="Type a message" value={chatText} onChange={(e) => setChatText(e.target.value)} />
          <Button sx={{ mt: 1 }} variant="contained" disabled={!chatText.trim()} onClick={() => { supportStore.sendMessage(chatText); supportStore.sendMessage('Thanks. Our local support assistant has received your message.', 'support'); setMessages(supportStore.messages()); setChatText(''); }}>Send</Button>
        </Box>

        {/* FAQ Section Card */}
        <Box className="faq-container-card">
          <Typography className="faq-main-heading">What Issue are you facing?</Typography>

          <Box className="accordion-list">
            {faqs.map((faq, idx) => (
              <Accordion key={idx} disableGutters elevation={0} className="custom-faq-accordion">
                <AccordionSummary expandIcon={<ExpandMoreIcon className="accordion-arrow" />}>
                  <Typography className="faq-question-text">{faq.q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography className="faq-answer-text">{faq.a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      </Box>

      <BottomNav />
    </Box>
  );
};

export default HelpCenterPage;
