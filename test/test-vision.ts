import fs from 'node:fs';
import path from 'node:path';

// Automatically load environment variables from .env.local if not already loaded
function loadEnv() {
  const envLocal = path.resolve(process.cwd(), '.env.local');
  const envDefault = path.resolve(process.cwd(), '.env');

  if (fs.existsSync(envLocal) && typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile(envLocal);
  } else if (fs.existsSync(envDefault) && typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile(envDefault);
  } else {
    // Fallback simple line parser if process.loadEnvFile is not available
    const target = fs.existsSync(envLocal) ? envLocal : fs.existsSync(envDefault) ? envDefault : null;
    if (target) {
      const content = fs.readFileSync(target, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

import { analyzeImages } from '../src/lib/ai/vision';
import { getAIConfig } from '../src/lib/ai/client';

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.jpg':
    case '.jpeg':
    default:
      return 'image/jpeg';
  }
}

async function runVisionTest() {
  console.log('='.repeat(60));
  console.log('   WanderInk - OmniRoute Vision Model Test');
  console.log('='.repeat(60));

  let config;
  try {
    config = getAIConfig();
  } catch (err: any) {
    console.error('\n❌ Configuration error:', err.message);
    process.exit(1);
  }

  console.log(`Endpoint:    ${config.baseUrl}`);
  console.log(`Vision Model:${config.visionModel}`);

  // Determine test image
  const argImage = process.argv[2];
  let imageUri: string;
  let imageDescription: string;

  if (argImage) {
    if (argImage.startsWith('http://') || argImage.startsWith('https://') || argImage.startsWith('data:')) {
      imageUri = argImage;
      imageDescription = argImage;
    } else {
      const resolved = path.resolve(process.cwd(), argImage);
      if (!fs.existsSync(resolved)) {
        console.error(`\n❌ Error: Image file not found: ${resolved}`);
        process.exit(1);
      }
      const buffer = fs.readFileSync(resolved);
      const mime = getMimeType(resolved);
      imageUri = `data:${mime};base64,${buffer.toString('base64')}`;
      imageDescription = `${resolved} (${(buffer.length / 1024).toFixed(1)} KB)`;
    }
  } else {
    // Default to test/image/1.jpeg if present
    const defaultImagePath = path.resolve(process.cwd(), 'test/image/1.jpeg');
    if (fs.existsSync(defaultImagePath)) {
      const buffer = fs.readFileSync(defaultImagePath);
      const mime = getMimeType(defaultImagePath);
      imageUri = `data:${mime};base64,${buffer.toString('base64')}`;
      imageDescription = `${defaultImagePath} (${(buffer.length / 1024).toFixed(1)} KB)`;
    } else {
      console.error('\n❌ No test image found at test/image/1.jpeg and no path provided.');
      console.log('Usage: npx tsx test/test-vision.ts [image-path-or-url]');
      process.exit(1);
    }
  }

  console.log(`Test Image:  ${imageDescription}`);
  console.log('-'.repeat(60));
  console.log('Sending request to Vision Model with automatic retry support...\n');

  const startTime = Date.now();
  try {
    const result = await analyzeImages([imageUri], {
      maxRetries: 3,
      initialDelayMs: 2000,
    });
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Vision analysis completed in ${elapsedSec}s!\n`);
    console.log('📋 Structured Results:');
    console.log('─'.repeat(40));
    console.log('• Title Suggestions:');
    result.titleSuggestions.forEach((t) => console.log(`   - "${t}"`));
    console.log(`\n• Mood:\n   ${result.mood}`);
    console.log(`\n• Detected Scenes:\n   ${result.detectedScenes.join(', ')}`);
    console.log(`\n• Detected Objects:\n   ${result.detectedObjects.join(', ')}`);
    console.log('\n• Notable Details:');
    result.notableDetails.forEach((d) => console.log(`   - ${d}`));
    console.log('\n• Narrative Elements:');
    result.storyElements.forEach((e) => console.log(`   - ${e}`));
    console.log('─'.repeat(40));
  } catch (error: any) {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ Vision test failed after ${elapsedSec}s:`, error.message);
    if (error.stack) {
      console.error('\nStack Trace:\n', error.stack);
    }
    process.exit(1);
  }
}

runVisionTest();
