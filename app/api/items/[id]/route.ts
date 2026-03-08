import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Item from '@/lib/models/Item';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const item = await Item.findById(params.id)
      .populate('owner', 'name avatar rating reviewCount location')
      .lean();

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
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const item = await Item.findById(params.id);
    
    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (item.owner.toString() !== decoded.userId) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    const updates = await request.json();
    const updatedItem = await Item.findByIdAndUpdate(
      params.id,
      updates,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Item updated successfully',
      item: updatedItem
    });

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
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const item = await Item.findById(params.id);
    
    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    if (item.owner.toString() !== decoded.userId) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    await Item.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Item deleted successfully' });

  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { message: 'Error deleting item', error: error.message },
      { status: 500 }
    );
  }
}
