# Medical Voice Intake Form

An AI-powered medical patient intake form with voice dictation and intelligent field extraction. Features multiple speech-to-text providers and smart contextual understanding.

![Demo](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)

## ✨ Features

- **Multi-Provider Speech-to-Text**
  - ElevenLabs Scribe API (high accuracy)
  - Deepgram Nova (fast transcription)
  - Google Gemini 2.0 Flash (multimodal audio)
  - Switch providers with one click

- **Intelligent Field Extraction**
  - Powered by Google Gemini Flash 2.5
  - Smart gender detection from pronouns (he/him → male, she/her → female)
  - Contextual understanding of medical terminology
  - Reads between the lines for implicit information

- **Smooth UX**
  - Typing animation effect (15ms per character)
  - Real-time field population
  - Dark/light mode support
  - Responsive design

- **Form Validation**
  - Zod schema validation
  - React Hook Form integration
  - Real-time error feedback

## 📋 Patient Form Fields

- **Patient Name** - Full name extraction
- **Age** - Numeric value from "years old"
- **Gender** - Inferred from pronouns or explicit mentions
- **Chief Complaint** - Primary reason for visit
- **Symptoms** - Comprehensive symptom list
- **Medical History** - Past conditions and surgeries
- **Allergies** - Medication, food, environmental
- **Current Medications** - Active prescriptions

## 🚀 Quick Start

### Prerequisites

Node.js 18+ and API keys from at least one provider:

- **[ElevenLabs API Key](https://elevenlabs.io/app/settings/api-keys)** (Scribe API)
- **[Deepgram API Key](https://console.deepgram.com/)** (optional)
- **[Google AI Studio API Key](https://aistudio.google.com/apikey)** (required for extraction)

### Installation

```bash
# Clone the repository
git clone https://github.com/frankwiersma/voice-form-demo.git
cd voice-form-demo

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your API keys
# At minimum, you need GOOGLE_GENERATIVE_AI_API_KEY and one STT provider key
```

### Environment Variables

Edit `.env.local`:

```env
# Speech-to-Text Providers (choose at least one)
ELEVENLABS_API_KEY=sk_...
DEEPGRAM_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...  # Required for both STT and extraction
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Voice Dictation

1. Click the **"Voice Fill"** button
2. Allow microphone access
3. Speak naturally:

   ```
   "Patient is Sarah Johnson, 32 years old. She has stomach pain
   and nausea for the past 3 days. History of diabetes.
   Allergic to penicillin. She takes insulin daily."
   ```

4. Click button again to stop
5. Watch fields populate with typing animation!

### Example Phrases

- **Gender Detection**: "He has chest pain" → gender: male
- **Age Extraction**: "Patient is 45 years old" → age: 45
- **Medications**: "She takes vitamin D and aspirin" → medications: "vitamin D and aspirin"
- **Chief Complaint**: "Presenting with severe headache" → chiefComplaint: "severe headache"

## 🛠️ Technology Stack

- **[Next.js 15.3.1](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first styling
- **[ElevenLabs SDK](https://elevenlabs.io/)** - Speech-to-text (Scribe v1)
- **[Deepgram SDK](https://deepgram.com/)** - Alternative STT (Nova 2)
- **[Google Generative AI SDK](https://ai.google.dev/)** - Gemini for STT and extraction
- **[React Hook Form](https://react-hook-form.com/)** - Form state management
- **[Zod](https://zod.dev/)** - Schema validation
- **[Radix UI](https://www.radix-ui.com/)** - Accessible components
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode

## 📁 Project Structure

```
voice-form-demo/
├── actions/
│   └── voice-to-form.ts       # Server action: STT + AI extraction
├── app/
│   ├── globals.css            # Theme variables
│   ├── layout.tsx             # Root layout with theme provider
│   └── page.tsx               # Main form with recording logic
├── components/
│   ├── theme-toggle.tsx       # Dark/light mode toggle
│   └── ui/                    # Shadcn-style components
│       ├── button.tsx
│       ├── card.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── textarea.tsx
│       └── voice-button.tsx   # Recording button with states
├── lib/
│   ├── schema.ts              # Zod form schema
│   └── utils.ts               # Utility functions
├── .env.example               # Environment template
├── .env.local                 # Your API keys (not in git)
└── package.json
```

## 🔧 How It Works

### 1. Audio Capture
```typescript
// MediaRecorder API captures microphone audio
const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS)
const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
```

### 2. Speech-to-Text
Choose from 3 providers:
- **ElevenLabs Scribe**: High accuracy, medical-grade
- **Deepgram Nova**: Fast, cost-effective
- **Gemini 2.0 Flash**: Multimodal audio understanding

### 3. AI Extraction
```typescript
// Gemini Flash 2.5 extracts structured data from transcription
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { temperature: 0 }
})
```

### 4. Field Population
```typescript
// Typing animation (15ms per character)
for (let j = 0; j <= chars.length; j++) {
  form.setValue(key, chars.slice(0, j).join(''))
  await sleep(15)
}
```

## 🐛 Troubleshooting

### Microphone Not Working
- **Browser Settings**: Check mic permissions in browser settings
- **HTTPS Required**: Production requires HTTPS (localhost works in dev)
- **Browser Support**: Chrome/Edge recommended

### API Key Errors
```bash
# Verify .env.local exists and has correct format
cat .env.local

# Restart dev server after changes
npm run dev
```

### Fields Not Populating
- Check browser console for API errors
- Verify Google API key has Gemini API enabled
- Try speaking more clearly or adjusting microphone

### Build Errors
```bash
# Clean install
rm -rf node_modules .next
npm install
npm run dev
```

## 📝 Development

### Adding New Fields

1. Update schema in `lib/schema.ts`:
```typescript
export const doctorFormSchema = z.object({
  patientName: z.string().min(1),
  // ... add your field here
  newField: z.string().optional(),
})
```

2. Update extraction prompt in `actions/voice-to-form.ts`

3. Add form field in `app/page.tsx`

### Customizing Extraction

Edit the system prompt in `actions/voice-to-form.ts:117-168` to adjust field extraction logic.

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

Built with modern AI tools and open-source libraries. Inspired by the need for faster medical documentation.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**⚡ Fast • 🎯 Accurate • 🔒 Secure**
