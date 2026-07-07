export const metadata = {
  title: 'Terms & Conditions | House Of Ginija',
  description: 'Review the legal terms of service, custom garment policies, and transaction conditions of House Of Ginija.',
};

export default function TermsPage() {
  return (
    <div style={pageStyle} className="container animate-fade-in info-page-container">
      <h1 style={titleStyle}>Terms & Conditions</h1>
      <div style={dividerStyle}></div>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>1. Scope of Agreement</h2>
          <p style={textStyle}>
            By accessing this website and purchasing our hand-finished garments, you agree to comply with these Terms and Conditions. These terms apply to all buyers, registered users, and visitors browsing our catalog.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>2. Pricing and Payments</h2>
          <p style={textStyle}>
            All pricing listed in our collections is in Indian Rupees (INR) and includes applicable GST. We reserve the right to modify pricing, description details, and variant stock availability without prior notification. In the event of a catalog pricing discrepancy on an active order, we will contact you to verify before sewing.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>3. Intellectual Property</h2>
          <p style={textStyle}>
            All designs, sketches, images, patterns, logos, and custom embroidery illustrations displayed on this site are the exclusive intellectual property of House Of Ginija. Any unauthorized replication of our signature silhouettes or branding is strictly prohibited.
          </p>
        </section>
      </div>
    </div>
  );
}

// Inline styles for Terms Page (matching Shipping returns page exactly)
const pageStyle = {
  paddingTop: '4rem',
  paddingBottom: '6rem',
  backgroundColor: '#FFFFFF',
  maxWidth: '800px',
  margin: '0 auto',
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
