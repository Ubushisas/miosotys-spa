import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authorization Successful</title>
        <style>
          body {
            font-family: 'Manrope', sans-serif;
            background-color: #1a1a1a;
            color: #f2ede6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 3rem;
            background-color: #2a2a2a;
            border-radius: 1rem;
            border: 1px solid rgba(242, 237, 230, 0.1);
          }
          h1 {
            color: #f2ede6;
            margin-bottom: 1rem;
          }
          p {
            color: #b3b3b3;
            line-height: 1.7;
          }
          .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✓</div>
          <h1>Authorization Successful!</h1>
          <p>Google Calendar has been connected successfully.</p>
          <p>You can close this window and return to the booking system.</p>
        </div>
      </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
