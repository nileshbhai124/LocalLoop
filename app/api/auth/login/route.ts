import { NextRequest, NextResponse } from 'next/server';

// Demo credentials
const DEMO_USER = {
  id: 'demo_user_1',
  name: 'Demo User',
  email: 'demo@localloop.com',
  password: 'demo123',
  phone: '+91 98765 43210',
  address: 'Mumbai, Maharashtra',
  role: 'user',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check demo credentials
    if (email.toLowerCase() === DEMO_USER.email && password === DEMO_USER.password) {
      const token = `mock_token_${DEMO_USER.id}`;

      return NextResponse.json({
        message: 'Login successful (Demo Mode)',
        token,
        user: {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          phone: DEMO_USER.phone,
          address: DEMO_USER.address,
          role: DEMO_USER.role,
          avatar: DEMO_USER.avatar,
        },
        demo: true,
        demoNote: 'Use email: demo@localloop.com, password: demo123'
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { 
        message: 'Invalid credentials. Try demo account: demo@localloop.com / demo123',
        demo: true 
      },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error during login', error: error.message },
      { status: 500 }
    );
  }
}
