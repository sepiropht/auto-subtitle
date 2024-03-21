import fs from 'fs'
import tmp from 'tmp-promise'
import { whisper } from 'whisper-node'
import ffmpeg from 'fluent-ffmpeg'
import { ArgumentParser } from 'argparse'
import { exec } from 'child_process'

main()

async function main() {
  const args = parseArgs()
  const audioPaths = await getAudio(args.video)
  const options = {
    modelName: args.model, // default
    whisperOptions: {
      language: args.language, // default (use 'auto' for auto detect)
    },
  }

  const subtitles = await getSubtitles(
    audioPaths,
    args.output_srt || args.srt_only,
    args.output_dir,
    (audioPath) => {
      return whisper(audioPath, options)
    }
  )

  if (args.srt_only) {
    return
  }

  for (const [path, srtPath] of Object.entries(subtitles)) {
    const outPath = `${tmp.tmpNameSync()}.mkv`

    console.log(`Adding subtitles to ${filename(path)}...`)

    await addSubtitle(path, srtPath, outPath)
  }
}

function filename(path) {
  return path.split('/').pop().split('.').shift()
}

async function getAudio(paths) {
  const audioPaths = {}

  for (const path of paths) {
    console.log(`Extracting audio from ${filename(path)}...`)
    const outputFilePath = `${tmp.tmpNameSync()}.wav`

    await new Promise((resolve, reject) => {
      ffmpeg(path)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('error', (err) => reject(err))
        .on('end', () => resolve())
        .save(outputFilePath)
    })

    audioPaths[path] = outputFilePath
  }
  console.log({ audioPaths })
  return audioPaths
}

async function getSubtitles(audioPaths, outputSrt, outputDir, transcribe) {
  const subtitlesPath = {}

  for (const [path, audioPath] of Object.entries(audioPaths)) {
    const srtPath = outputSrt
      ? `${outputDir}/${filename(path)}.srt`
      : `${tmp.tmpNameSync()}.srt`

    console.log(
      `Generating subtitles for ${filename(path)}... This might take a while.`
    )

    const result = await transcribe(audioPath)
    console.log(result)

    fs.writeFileSync(
      srtPath,
      result
        .map(
          (segment, index) =>
            `${index + 1}\n${segment.start} --> ${segment.end}\n${
              segment.speech
            }\n`
        )
        .join('\n')
    )

    subtitlesPath[path] = srtPath
  }
  console.log(subtitlesPath)
  return subtitlesPath
}

function addSubtitle(inputMKV, inputSubtitle, outputMP4) {
  const command = `ffmpeg -i "${inputMKV}" -vf "subtitles=${inputSubtitle}:force_style='OutlineColour=&H40000000,BorderStyle=3'" "${outputMP4}"`

  console.log('Executing command:', command)

  // Execute the FFmpeg command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`)
      return
    }
    console.log(`stdout: ${stdout}`)
  })
}

function parseArgs() {
  const parser = new ArgumentParser({
    description: 'Script description here',
  })

  parser.addArgument('video', {
    nargs: '+',
    type: 'string',
    help: 'paths to video files to transcribe',
  })

  parser.addArgument('--model', {
    defaultValue: 'small',
    choices: ['base.en', 'base', 'large-v1'],
    help: 'name of the Whisper model to use',
  })

  parser.addArgument(['--output_dir', '-o'], {
    type: 'string',
    defaultValue: '.',
    help: 'directory to save the outputs',
  })

  parser.addArgument('--output_srt', {
    action: 'storeTrue',
    help: 'whether to output the .srt file along with the video files',
  })

  parser.addArgument('--srt_only', {
    action: 'storeTrue',
    help: 'only generate the .srt file and not create overlayed video',
  })

  parser.addArgument('--verbose', {
    action: 'storeTrue',
    help: 'whether to print out the progress and debug messages',
  })

  parser.addArgument('--task', {
    type: 'string',
    defaultValue: 'transcribe',
    choices: ['transcribe', 'translate'],
    help: "whether to perform X->X speech recognition ('transcribe') or X->English translation ('translate')",
  })

  parser.addArgument('--language', {
    type: 'string',
    defaultValue: 'auto',
    choices: [
      'auto',
      'af',
      'am',
      'ar',
      'as',
      'az',
      'ba',
      'be',
      'bg',
      'bn',
      'bo',
      'br',
      'bs',
      'ca',
      'cs',
      'cy',
      'da',
      'de',
      'el',
      'en',
      'es',
      'et',
      'eu',
      'fa',
      'fi',
      'fo',
      'fr',
      'gl',
      'gu',
      'ha',
      'haw',
      'he',
      'hi',
      'hr',
      'ht',
      'hu',
      'hy',
      'id',
      'is',
      'it',
      'ja',
      'jw',
      'ka',
      'kk',
      'km',
      'kn',
      'ko',
      'la',
      'lb',
      'ln',
      'lo',
      'lt',
      'lv',
      'mg',
      'mi',
      'mk',
      'ml',
      'mn',
      'mr',
      'ms',
      'mt',
      'my',
      'ne',
      'nl',
      'nn',
      'no',
      'oc',
      'pa',
      'pl',
      'ps',
      'pt',
      'ro',
      'ru',
      'sa',
      'sd',
      'si',
      'sk',
      'sl',
      'sn',
      'so',
      'sq',
      'sr',
      'su',
      'sv',
      'sw',
      'ta',
      'te',
      'tg',
      'th',
      'tk',
      'tl',
      'tr',
      'tt',
      'uk',
      'ur',
      'uz',
      'vi',
      'yi',
      'yo',
      'zh',
    ],
    help: 'What is the origin language of the video? If unset, it is detected automatically.',
  })

  return parser.parseArgs()
}
