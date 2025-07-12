import QuickAudioTester from '@/components/quick-audio-tester'

export default function TestAudioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🎙️ Audio Generation Test</h1>
          <p className="text-lg text-muted-foreground">
            AI AnimeVerse Audio System Test Page
          </p>
        </div>
        
        <div className="flex justify-center">
          <QuickAudioTester />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            यह page audio generation को test करने के लिए है। किसी भी text को audio में convert करें।
          </p>
        </div>
      </div>
    </div>
  )
} 