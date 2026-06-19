Drop bundled Game Plan PDFs in this folder using these exact filenames:

- technical.cz.pdf
- technical.en.pdf
- technical.de.pdf
- live.cz.pdf
- live.en.pdf
- live.de.pdf

The viewer route `/game-plan/$type` picks the file by current language and
falls back to the German version when the language-specific file is missing.