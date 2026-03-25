
import React, { useState, useRef } from 'react';
import { Mic, X, MessageCircle, PlayCircle, StopCircle } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface VoiceAssistantProps {
  language: string;
  profile: {
    name: string;
    region: string;
    trustScore: number;
    creditLimit: number;
    healthStatus: string;
  } | null;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language, profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesSet = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const startSession = async () => {
    setStatus('connecting');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct dynamic credit context based on farmer profile
    const profileText = profile 
      ? `FARMER PROFILE: {Name: ${profile.name}, Region: ${profile.region}, Trust Score: ${profile.trustScore}, Current Limit: ${profile.creditLimit} ETB, Verification: ${profile.healthStatus}}.`
      : "FARMER PROFILE: Unknown. Treat as a new user.";

    const creditRules = `
      CREDIT ACCESS INSTRUCTIONS:
      - If Trust Score > 800: Inform them they are eligible for the 'CBE Premium Micro-loan' with immediate approval.
      - If Trust Score 600-800: Advise them to post more verified harvest listings to reach the 800 threshold for better rates.
      - If Health Status is 'Excellent': Mention they qualify for a 2% interest rate reduction at local Agricultural Cooperatives.
      - General: Explain that AI-verified crop diagnoses directly increase their trust score and credit eligibility.
      - Financial Partners: Mention Commercial Bank of Ethiopia (CBE) and Awash Bank as primary micro-loan providers.
    `;

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setIsListening(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscripts(prev => [...prev.slice(-4), `AI: ${msg.serverContent!.outputTranscription!.text}`]);
            }
            if (msg.serverContent?.inputTranscription) {
              setTranscripts(prev => [...prev.slice(-4), `You: ${msg.serverContent!.inputTranscription!.text}`]);
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesSet.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesSet.current.add(source);
            }
          },
          onerror: (e) => setStatus('error'),
          onclose: () => setStatus('idle'),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `You are Shega Farm AI Assistant. 
          ${profileText}
          ${creditRules}
          GENERAL TASKS: Helping with pest control, market prices, and regional weather.
          IMPORTANT: ALWAYS RESPOND ONLY IN THE ${language.toUpperCase()} LANGUAGE. Keep responses brief, empathetic, and culturally respectful to Ethiopian farmers.`
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsListening(false);
    setStatus('idle');
    setTranscripts([]);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 overflow-hidden flex flex-col max-h-[400px]">
          <div className="bg-[#FF6F61] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
              <span className="font-bold">Shega Assistant ({language})</span>
            </div>
            <button onClick={() => { stopSession(); setIsOpen(false); }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto min-h-[150px] space-y-3 bg-gray-50">
            {transcripts.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-8">
                {status === 'idle' ? `Tap the mic to start a conversation in ${language}.` : "Connecting to Shega AI..."}
              </p>
            )}
            {transcripts.map((t, i) => (
              <div key={i} className={`p-2 rounded-lg text-xs ${t.startsWith('You:') ? 'bg-orange-100 ml-8' : 'bg-white shadow-sm mr-8 border border-gray-100'}`}>
                {t}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-center">
            {isListening ? (
              <button onClick={stopSession} className="bg-red-500 text-white rounded-full px-6 py-2 text-sm font-bold flex items-center gap-2 hover:bg-red-600 transition-colors">
                <StopCircle className="w-4 h-4" /> Stop
              </button>
            ) : (
              <button 
                onClick={startSession} 
                disabled={status === 'connecting'}
                className="bg-[#FF6F61] text-white rounded-full px-6 py-2 text-sm font-bold flex items-center gap-2 hover:bg-[#FF8B7F] transition-colors disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" /> 
                {status === 'connecting' ? 'Connecting...' : `Talk in ${language}`}
              </button>
            )}
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#FF6F61] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center justify-center border-4 border-white"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default VoiceAssistant;
