## mp3_to_Text
This repository uses OpenAI's Whisper to take .mp3 (or similar audio files) and transcribe them to text. This text is then fed into a local LLM (Ollama, using Mistral) to edit/correct for grammar. Ultimately three files are saved: 
1. The original text transcription; saved as a .txt under the Recording_text_files folder
2. The AI edits made to the text transcription to fix basic grammar; saved as a .docx under the Recording_docx_files_grammar_edits folder
3. The AI edits made to the text transcription to enhance the writing while still keeping the original author's style; saved as a .docx under the Recording_docx_files_AI_edits folder

This project is ideal for those who need to transcibe audio files for journaling, writing a book, preserving a family member's memories and history, etc. Happy transcription!