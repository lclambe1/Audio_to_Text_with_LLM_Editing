import whisper

"""
This project is used to transcribe audio files to text using the OpenAI Whisper model.
It uses a virtual environment with the requirements installed there.
It is intended to be used to transcribe audio files and then convert the .txt files to a .docx file.
From here, a LLM will be used to edit the .docx file to make it more readable.
"""

# STEP 1: Transcribe audio file to text; pulled from https://github.com/openai/whisper/blob/main/README.md
model = whisper.load_model("turbo")
result = model.transcribe("./Sample.m4a")
print(result["text"])