export const metadata = {
  title: 'Privacy Policy | House Of Ginija',
  description: 'Understand how House Of Ginija protects and handles your personal details, cookies, and checkout transactions.',
};

export default function PrivacyPage() {
  return (
    <div style={pageStyle} className="container animate-fade-in">
      <h1 style={titleStyle}>Privacy Policy</h1>
      <div style={dividerStyle}></div>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>1. Information We Collect</h2>
          <p style={textStyle}>
            When you register an account, checkout a garment, or subscribe to our newsletter dispatch, we gather client name, email address, physical delivery addresses, phone number, and transaction logs. This information is required to process and verify payments, arrange shipping, and handle custom fit requests.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>2. Cookies and Telemetry</h2>
          <p style={textStyle}>
            We utilize secure cookies (`auth_token` and `session_id`) to manage active client login states and track aggregate page visit counts. The analytics details collected are used to optimize our site navigation and catalog selections. We do not sell or trade your browsing history.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>3. Payment Processing</h2>
          <p style={textStyle}>
            All credit card, UPI, and bank checkout transactions are processed by our secure partner, Razorpay. House Of Ginija does not store your credit card numbers or financial passwords on our servers. All financial details are processed in accordance with PCI-DSS compliance regulations.
          </p>
        </section>
      </div>
    </div>
  );
}

// Inline styles for Privacy Page (matching Shipping returns page exactly)
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
