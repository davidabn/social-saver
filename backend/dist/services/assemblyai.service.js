import axios from 'axios';
import { supabaseAdmin } from '../lib/supabase.js';
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';
if (!ASSEMBLYAI_API_KEY) {
    console.warn('[AssemblyAI] Warning: ASSEMBLYAI_API_KEY not set');
}
// Start transcription job
async function startTranscription(audioUrl) {
    const response = await axios.post(`${ASSEMBLYAI_API_URL}/transcript`, {
        audio_url: audioUrl,
        language_detection: true // Auto-detect language
    }, {
        headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/json'
        }
    });
    return response.data.id;
}
// Check transcription status
async function getTranscriptionStatus(transcriptId) {
    const response = await axios.get(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
        headers: {
            'Authorization': ASSEMBLYAI_API_KEY
        }
    });
    return response.data;
}
// Poll for completion
async function waitForTranscription(transcriptId, maxWaitMs = 300000) {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds
    while (Date.now() - startTime < maxWaitMs) {
        const result = await getTranscriptionStatus(transcriptId);
        if (result.status === 'completed') {
            return result.text || '';
        }
        if (result.status === 'error') {
            throw new Error(`Transcription failed: ${result.error}`);
        }
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    throw new Error('Transcription timeout');
}
// Main function to transcribe a video
export async function transcribeVideo(contentId, videoUrl) {
    if (!ASSEMBLYAI_API_KEY) {
        console.error('[AssemblyAI] API key not configured, skipping transcription');
        return;
    }
    console.log(`[AssemblyAI] Starting transcription for content ${contentId}`);
    try {
        // Update status to processing
        await supabaseAdmin
            .from('saved_contents')
            .update({ transcription_status: 'processing' })
            .eq('id', contentId);
        // Start transcription
        const transcriptId = await startTranscription(videoUrl);
        console.log(`[AssemblyAI] Transcription job started: ${transcriptId}`);
        // Wait for completion (non-blocking in production, but for simplicity we wait)
        const text = await waitForTranscription(transcriptId);
        console.log(`[AssemblyAI] Transcription completed, length: ${text.length} chars`);
        // Save transcription to database
        const { error: insertError } = await supabaseAdmin
            .from('transcriptions')
            .upsert({
            content_id: contentId,
            text: text,
            language: 'auto',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'content_id'
        });
        if (insertError) {
            console.error('[AssemblyAI] Error saving transcription:', insertError);
            throw insertError;
        }
        // Update content status
        await supabaseAdmin
            .from('saved_contents')
            .update({
            transcription_status: 'completed',
            is_processed: true
        })
            .eq('id', contentId);
        console.log(`[AssemblyAI] Transcription saved for content ${contentId}`);
    }
    catch (error) {
        console.error('[AssemblyAI] Error transcribing video:', error);
        // Update status to failed
        await supabaseAdmin
            .from('saved_contents')
            .update({ transcription_status: 'failed' })
            .eq('id', contentId);
        throw error;
    }
}
// Queue transcription (fire and forget)
export function queueTranscription(contentId, videoUrl) {
    // Run transcription in background without blocking
    transcribeVideo(contentId, videoUrl).catch(error => {
        console.error(`[AssemblyAI] Background transcription failed for ${contentId}:`, error.message);
    });
}
//# sourceMappingURL=assemblyai.service.js.map