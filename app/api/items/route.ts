import { NextRequest, NextResponse } from 'next/server';
import { mockItems } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || '-createdAt';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Filter items
    let filteredItems = [...mockItems];

    if (category && category !== 'All') {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }

    if (minPrice) {
      filteredItems = filteredItems.filter(item => item.pricePerDay >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filteredItems = filteredItems.filter(item => item.pricePerDay <= parseFloat(maxPrice));
    }

    // Sort items
    if (sort === 'pricePerDay') {
      filteredItems.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sort === '-pricePerDay') {
      filteredItems.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sort === 'rating') {
      filteredItems.sort((a, b) => b.rating - a.rating);
    }

    // Paginate
    const total = filteredItems.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Get items error:', error);
    return NextResponse.json(
      { message: 'Error fetching items', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Item creation is disabled in demo mode. Connect MongoDB to enable.',
      demo: true
    }, { status: 503 });
  } catch (error: any) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { message: 'Error creating item', error: error.message },
      { status: 500 }
    );
  }
}
