import React from 'react';

interface EmailBaseTemplateProps {
  children: React.ReactNode;
  previewText?: string;
}

export const EmailBaseTemplate: React.FC<EmailBaseTemplateProps> = ({
  children,
  previewText,
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Relynk</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 300;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #fefefe;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(190, 24, 93, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f9a8d4 100%);
            padding: 32px 24px;
            text-align: center;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 600;
            color: #be185d;
            margin-bottom: 8px;
          }
          
          .tagline {
            font-size: 14px;
            color: #831843;
            opacity: 0.8;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .footer {
            background-color: #fdf2f8;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #f3e8ff;
          }
          
          .footer-text {
            font-size: 12px;
            color: #831843;
            opacity: 0.7;
          }
          
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            margin: 16px 0;
            transition: all 0.3s ease;
          }
          
          .button:hover {
            box-shadow: 0 0 25px rgba(249, 168, 212, 0.4);
          }
          
          .card {
            background-color: #fefefe;
            border: 1px solid #f3e8ff;
            border-radius: 12px;
            padding: 20px;
            margin: 16px 0;
          }
          
          .text-muted {
            color: #831843;
            opacity: 0.7;
            font-size: 14px;
          }
          
          .text-primary {
            color: #be185d;
            font-weight: 500;
          }
          
          .divider {
            height: 1px;
            background-color: #f3e8ff;
            margin: 24px 0;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: 500;
            color: #1a1a1a;
            margin-bottom: 16px;
          }
          
          p {
            margin-bottom: 16px;
          }
          
          .highlight {
            background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #ec4899;
          }
        `}</style>
      </head>
      <body>
        {previewText && (
          <div style={{ display: 'none', fontSize: '1px', color: '#fefefe', lineHeight: '1px', maxHeight: '0px', maxWidth: '0px', opacity: 0, overflow: 'hidden' }}>
            {previewText}
          </div>
        )}
        
        <div className="container">
          <div className="header">
            <div className="logo">🔗 Relynk</div>
            <div className="tagline">Create. Share. Get Paid. All Onchain.</div>
          </div>
          
          <div className="content">
            {children}
          </div>
          
          <div className="footer">
            <div className="footer-text">
              © 2024 Relynk. Powered by Web3 technology.<br />
              This email was sent regarding your blockchain transaction.
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};