import { createWorker } from 'tesseract.js';
import { supabaseAdmin } from '../lib/supabase.js';
// Queue image transcription (fire and forget)
export function queueImageTranscription(contentId, imageUrls) {
    transcribeImages(contentId, imageUrls).catch(error => {
        console.error(`[OCR] Background transcription failed for ${contentId}:`, error.message);
    });
}
// Main function to transcribe images
export async function transcribeImages(contentId, imageUrls) {
    console.log(`[OCR] Starting transcription for content ${contentId} with ${imageUrls.length} images`);
    try {
        // Update status to processing
        await supabaseAdmin
            .from('saved_contents')
            .update({ transcription_status: 'processing' })
            .eq('id', contentId);
        const worker = await createWorker('eng+por'); // Support English and Portuguese
        let fullText = '';
        for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            console.log(`[OCR] Processing image ${i + 1}/${imageUrls.length}: ${url}`);
            const { data: { text } } = await worker.recognize(url);
            if (text.trim()) {
                if (imageUrls.length > 1) {
                    fullText += `[Image ${i + 1}]\n${text.trim()}\n\n`;
                }
                else {
                    fullText += `${text.trim()}\n`;
                }
            }
        }
        await worker.terminate();
        console.log(`[OCR] Transcription completed, length: ${fullText.length} chars`);
        // Save transcription to database
        // Using 'text' column as discovered in codebase_investigator
        const { error: insertError } = await supabaseAdmin
            .from('transcriptions')
            .upsert({
            content_id: contentId,
            text: fullText,
            language: 'auto', // Tesseract auto-detects roughly based on loaded lang, but we set 'auto' for schema consistency
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'content_id'
        });
        if (insertError) {
            console.error('[OCR] Error saving transcription:', insertError);
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
        console.log(`[OCR] Transcription saved for content ${contentId}`);
    }
    catch (error) {
        console.error('[OCR] Error transcribing images:', error);
        // Update status to failed
        await supabaseAdmin
            .from('saved_contents')
            .update({ transcription_status: 'failed' })
            .eq('id', contentId);
        throw error;
    }
}
//# sourceMappingURL=ocr.service.js.map