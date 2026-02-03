const fs = require('fs');
const path = require('path');

// Transcription service using Google Gemini API
class TranscriptionService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  async transcribe(videoPath) {
    if (!this.apiKey) {
      console.log('Gemini API key not configured - skipping transcription');
      return { success: false, error: 'API key not configured' };
    }

    try {
      // Dynamic import for Google Generative AI
      const { GoogleGenerativeAI, GoogleAIFileManager } = await import('@google/generative-ai/server');
      const { GoogleGenerativeAI: ClientAI } = await import('@google/generative-ai');

      const fileManager = new GoogleAIFileManager(this.apiKey);
      const genAI = new ClientAI(this.apiKey);

      // Check if file exists
      if (!fs.existsSync(videoPath)) {
        return { success: false, error: 'Video file not found' };
      }

      // Get file stats
      const stats = fs.statSync(videoPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      // Gemini File API supports up to 2GB
      if (fileSizeMB > 500) {
        console.log(`File too large for transcription (${fileSizeMB.toFixed(2)}MB).`);
        return {
          success: false,
          error: 'File too large. Please upload videos under 500MB for automatic transcription, or add a script manually.'
        };
      }

      console.log(`Transcribing video (${fileSizeMB.toFixed(2)}MB): ${videoPath}`);

      // Determine mime type from extension
      const ext = path.extname(videoPath).toLowerCase();
      const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska',
        '.m4v': 'video/x-m4v'
      };
      const mimeType = mimeTypes[ext] || 'video/mp4';

      // Upload the file using File API
      console.log('Uploading video to Gemini...');
      const uploadResult = await fileManager.uploadFile(videoPath, {
        mimeType: mimeType,
        displayName: path.basename(videoPath),
      });

      console.log(`File uploaded: ${uploadResult.file.name}`);

      // Wait for file to be processed
      let file = uploadResult.file;
      while (file.state === 'PROCESSING') {
        console.log('Waiting for file processing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        file = await fileManager.getFile(file.name);
      }

      if (file.state === 'FAILED') {
        throw new Error('File processing failed');
      }

      console.log('File ready, generating transcript...');

      // Use Gemini 2.5 Flash for transcription
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri
          }
        },
        {
          text: `Please transcribe all spoken words in this video.
Output ONLY the transcription text, nothing else.
Do not include timestamps, speaker labels, or any other annotations.
If there is no speech, respond with "[No speech detected]".
Transcribe exactly what is said, preserving the natural flow of speech.`
        }
      ]);

      const response = await result.response;
      const transcript = response.text().trim();

      // Clean up - delete the uploaded file
      try {
        await fileManager.deleteFile(file.name);
        console.log('Cleaned up uploaded file');
      } catch (e) {
        console.log('Could not delete uploaded file:', e.message);
      }

      if (transcript === '[No speech detected]' || !transcript) {
        console.log('No speech detected in video');
        return { success: true, transcript: '' };
      }

      console.log('Transcription completed successfully');
      return { success: true, transcript: transcript };
    } catch (error) {
      console.error('Transcription error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Process transcription in background
  async processVideoTranscription(video, videoPath) {
    const { Video } = require('../models');

    try {
      // Update status to processing
      await Video.update(
        { transcriptStatus: 'processing' },
        { where: { id: video.id } }
      );

      const result = await this.transcribe(videoPath);

      if (result.success) {
        await Video.update(
          {
            transcript: result.transcript,
            transcriptStatus: 'completed'
          },
          { where: { id: video.id } }
        );
        console.log(`Transcription saved for video ${video.id}`);
      } else {
        await Video.update(
          { transcriptStatus: 'failed' },
          { where: { id: video.id } }
        );
        console.log(`Transcription failed for video ${video.id}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error processing transcription for video ${video.id}:`, error);
      await Video.update(
        { transcriptStatus: 'failed' },
        { where: { id: video.id } }
      );
    }
  }
}

module.exports = new TranscriptionService();
