import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripeFormProps {
  onSuccess: () => void;
}

export default function StripeForm({ onSuccess }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // This prevents automatic redirect so we can handle success state
    });

    if (error) {
      setMessage(error.message || 'An error occurred with payment');
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded!
      setMessage('Payment authorized successfully!');
      onSuccess();
    } else {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={{ marginTop: '16px' }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      <button 
        type="submit" 
        disabled={isLoading || !stripe || !elements}
        className="btn btn-primary"
        style={{ width: "100%", padding: "12px", marginTop: "16px" }}
      >
        {isLoading ? "Processing..." : "Pay with Credit Card"}
      </button>
      {message && <div style={{ color: 'var(--error)', marginTop: '8px', fontSize: '14px' }}>{message}</div>}
    </form>
  );
}
