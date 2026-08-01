import React from 'react';
import BypassTicketCreation from './BypassTicketCreation';

const TicketBookingForm = ({ onBookingCreated, onNavigate }) => {
  return (
    <BypassTicketCreation
      onBookingCreated={onBookingCreated}
      onNavigate={onNavigate}
    />
  );
};

export default TicketBookingForm;
