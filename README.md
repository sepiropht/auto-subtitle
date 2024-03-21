# Automatic subtitles in your videos

This repository uses `ffmpeg` and [OpenAI's Whisper](https://openai.com/blog/whisper) to automatically generate and overlay subtitles on any video.

## Installation

You'll also need to install [`ffmpeg`](https://ffmpeg.org/), which is available from most package managers:

```bash
# on Ubuntu or Debian
sudo apt update && sudo apt install ffmpeg

# on MacOS using Homebrew (https://brew.sh/)
brew install ffmpeg

# on Windows using Chocolatey (https://chocolatey.org/)
choco install ffmpeg
```

## Usage

First install the model for whisper and choose small, the default model, if you choose a another model you will need to change too when you call the script.
   
    npx whisper-node download

The following command will generate a `subtitled/video.mp4` file contained the input video with overlayed subtitles.

    npx auto-subtitle /path/to/video.mp4 -o subtitled/

The default setting (which selects the `small` model) works well for transcribing English. You can optionally use a bigger model for better results (especially with other languages). The available models are `tiny`, `tiny.en`, `base`, `base.en`, `small`, `small.en`, `medium`, `medium.en`, `large`.

    npx auto-subtitle /path/to/video.mp4 --model medium

Adding `--task translate` will translate the subtitles into English:

    npx auto-subtitle /path/to/video.mp4 --task translate

## License

This script is open-source and licensed under the MIT License. For more details, check the [LICENSE](LICENSE) file.

