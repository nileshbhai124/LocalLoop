import { NextRequest, NextResponse } from 'next/server';

// Mock user storage (in-memory, resets on deployment)
const mockUsers: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, address } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = mockUsers.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Create mock user
    const user = {
      id: `user_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone,
      address,
      role: 'user',
      createdAt: new Date()
    };

    mockUsers.push(user);

    // Generate mock token
    const token = `mock_token_${user.id}`;

    return NextResponse.json({
      message: 'User registered successfully (Demo Mode - data will not persist)',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      demo: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Server error during registration', error: error.message },
      { status: 500 }
    );
  }
}
