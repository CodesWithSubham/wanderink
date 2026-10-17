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

import { generateStory } from '../src/lib/ai/story';
import { getAIConfig } from '../src/lib/ai/client';

async function runStoryTest() {
  console.log('='.repeat(60));
  console.log('   WanderInk - OmniRoute Story Model Test');
  console.log('='.repeat(60));

  let config;
  try {
    config = getAIConfig();
  } catch (err: any) {
    console.error('\n❌ Configuration error:', err.message);
    process.exit(1);
  }

  console.log(`Endpoint:    ${config.baseUrl}`);
  console.log(`Story Model: ${config.storyModel}`);

  // Default realistic mock vision analysis to feed the story model
  const sampleAnalysis = {
    titleSuggestions: [
      'Whispers of the Misty Pines',
      'Echoes Along the Ridge Trail',
      'Solitude at Timberline Ridge',
    ],
    detectedObjects: [
      'pine trees',
      'stone cairn',
      'mountain ridge',
      'wooden footbridge',
      'wildflowers',
      'mist',
    ],
    detectedScenes: [
      'alpine forest trail',
      'foggy mountain overlook',
      'rocky summit pass',
    ],
    mood: 'serene, contemplative, adventurous',
    notableDetails: [
      'Golden hour sunlight cutting through dense morning fog',
      'Ancient moss-draped boulders flanking the narrow winding path',
      'Dewdrops clinging to pine needles',
    ],
    storyElements: [
      'Starting before dawn into the chilly mountain air',
      'Quiet solitude and finding stillness away from the noise',
      'A rewarding vantage point watching the valley wake up',
    ],
    imageDescriptions: [
      'A narrow trail winds between moss-draped boulders under a canopy of misty pines, with faint light filtering through the fog in the distance.',
      'A stone cairn marks the edge of a rocky overlook as pale morning light spills across a valley still buried under a layer of low cloud.',
    ],
  };

  console.log('-'.repeat(60));
  console.log('Input Test Analysis:');
  console.log(`• Mood:    ${sampleAnalysis.mood}`);
  console.log(`• Scenes:  ${sampleAnalysis.detectedScenes.join(', ')}`);
  console.log(`• Objects: ${sampleAnalysis.detectedObjects.join(', ')}`);
  console.log(`• Photos:  ${sampleAnalysis.imageDescriptions.length} described`);
  console.log('-'.repeat(60));
  console.log('Sending request to Story Model with automatic retry support...\n');

  const startTime = Date.now();
  try {
    const story = await generateStory(sampleAnalysis, {
      maxRetries: 3,
      initialDelayMs: 2000,
    });
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Story generation completed in ${elapsedSec}s!\n`);
    console.log('📖 Generated Story Output:');
    console.log('─'.repeat(60));
    console.log(`Title:      "${story.title}"`);
    console.log(`Mood Score: ${story.moodScore}/10`);
    console.log(`\nSummary:\n${story.summary}`);
    console.log('\nHighlights:');
    story.highlights.forEach((h) => console.log(`  • ${h}`));
    console.log('\nFull Story:\n');
    console.log(story.fullStory);
    console.log('─'.repeat(60));
  } catch (error: any) {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ Story test failed after ${elapsedSec}s:`, error.message);
    if (error.stack) {
      console.error('\nStack Trace:\n', error.stack);
    }
    process.exit(1);
  }
}

runStoryTest();
