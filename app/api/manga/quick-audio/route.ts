import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📡 Frontend API: Proxying quick-audio request to backend')
    console.log('📋 Request body:', body)
    
    const response = await fetch(`${BACKEND_URL}/api/manga/quick-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    console.log('✅ Backend response:', data)
    
    if (!response.ok) {
      throw new Error(data.message || 'Backend request failed')
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Frontend API error:', error)
    return NextResponse.json(
      { 
        error: 'Quick audio generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 