export const metadata = {
  title: 'Shipping & Returns | House Of Ginija',
  description: 'Read the shipping policy, delivery timelines, bespoke alteration arrangements, and return conditions of House Of Ginija.',
};

export default function ShippingPage() {
  return (
    <div style={pageStyle} className="container animate-fade-in info-page-container">
      <h1 style={titleStyle}>Shipping & Returns</h1>
      <div style={dividerStyle}></div>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>1. Shipping and Delivery Timelines</h2>
          <p style={textStyle}>
            All House Of Ginija garments are hand-finished in our Hyderabad studio. Because we emphasize careful pattern cutting and slow production to ensure heirloom quality, our standard dispatch window is <strong>7 to 10 business days</strong> from the date of order payment verification.
          </p>
          <p style={textStyle}>
            Once dispatched, you will receive a tracking link via email. Insured delivery across India is complimentary on all orders exceeding ₹10,000. For orders under ₹10,000, a flat shipping fee of ₹250 applies.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>2. Bespoke Fit Adjustments</h2>
          <p style={textStyle}>
            We offer complimentary fit adjustments on all our garments. If you require length adjustments, waist narrowing, or other minor pattern customizations, please contact our concierge via <strong>concierge@houseofginija.com</strong> with your order number and exact body measurements within 24 hours of checkout.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>3. Exchange and Return Conditions</h2>
          <p style={textStyle}>
            Due to the hand-finished and made-to-order nature of our collection, we do not support direct refunds. However, we accept size exchanges and store credit returns under the following guidelines:
          </p>
          <ul style={listStyle}>
            <li>Exchange requests must be submitted within <strong>7 days</strong> of delivery receipt.</li>
            <li>Garments must be unworn, unwashed, unaltered, and returned with all original tags, hangers, and dust bags intact.</li>
            <li>Custom bespoke-adjusted garments (tailored specifically to client measurements) are final sale and cannot be returned or exchanged.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

// Inline styles for Shipping Page
const pageStyle = {
  paddingTop: '4rem',
  paddingBottom: '6rem',
  backgroundColor: '#FFFFFF',
  maxWidth: '800px',
};

const titleStyle = {
  fontSize: '2.5rem',
  fontFamily: 'var(--font-serif)',
  color: '#D98E9B',
  textAlign: 'center',
  fontWeight: '400',
};

const dividerStyle = {
  width: '60px',
  height: '1px',
  backgroundColor: '#D98E9B',
  margin: '1.2rem auto 2.5rem auto',
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2.5rem',
};

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const sectionTitleStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.4rem',
  color: '#D98E9B',
  fontWeight: '500',
};

const textStyle = {
  fontSize: '0.92rem',
  lineHeight: 1.7,
  color: '#000000',
};

const listStyle = {
  fontSize: '0.92rem',
  lineHeight: 1.7,
  color: '#000000',
  paddingLeft: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};
