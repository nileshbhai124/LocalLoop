import { NextRequest, NextResponse } from 'next/server';
import { mockItems } from '@/lib/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = mockItems.find(item => item.id === params.id);

    if (!item) {
      return NextResponse.json(
        { message: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });

  } catch (error: any) {
    console.error('Get item error:', error);
    return NextResponse.json(
      { message: 'Error fetching item', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json({
      message: 'Item updates are disabled in demo mode. Connect MongoDB to enable.',
      demo: true
    }, { status: 503 });
  } catch (error: any) {
    console.error('Update item error:', error);
    return NextResponse.json(
      { message: 'Error updating item', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json({
      message: 'Item deletion is disabled in demo mode. Connect MongoDB to enable.',
      demo: true
    }, { status: 503 });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { message: 'Error deleting item', error: error.message },
      { status: 500 }
    );
  }
}
